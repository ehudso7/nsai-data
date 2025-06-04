"""
Base Agent System for NSAI Data
"""

import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, TypeVar, Generic
from uuid import uuid4
import time

from pydantic import BaseModel, Field
from backend.core.logging import get_logger, log_agent_action
from backend.core.exceptions import AgentError, TimeoutError
from backend.core.config import settings


logger = get_logger(__name__)


class AgentMessage(BaseModel):
    """Message passed between agents"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    agent_id: str
    content: Any
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_type: str = "data"


class AgentResult(BaseModel):
    """Result from agent execution"""
    agent_name: str
    success: bool
    data: Any
    error: Optional[str] = None
    duration_ms: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


T = TypeVar('T')


class BaseAgent(ABC, Generic[T]):
    """Base class for all agents in the system"""
    
    def __init__(self, name: str, timeout: int = 30):
        self.name = name
        self.id = f"{name}_{uuid4().hex[:8]}"
        self.timeout = timeout
        self.logger = logger.bind(agent_name=name, agent_id=self.id)
        self._context: Dict[str, Any] = {}
        
    async def execute(self, input_data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        """Execute the agent with timeout and error handling"""
        start_time = time.time()
        self._context = context or {}
        
        try:
            self.logger.info(f"Agent {self.name} starting execution")
            
            # Execute with timeout
            result = await asyncio.wait_for(
                self._execute(input_data),
                timeout=self.timeout
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            # Log successful execution
            log_agent_action(
                agent_name=self.name,
                action="execute",
                duration_ms=duration_ms,
                success=True
            )
            
            return AgentResult(
                agent_name=self.name,
                success=True,
                data=result,
                duration_ms=duration_ms,
                metadata=self._get_metadata()
            )
            
        except asyncio.TimeoutError:
            duration_ms = (time.time() - start_time) * 1000
            error_msg = f"Agent execution timed out after {self.timeout}s"
            
            log_agent_action(
                agent_name=self.name,
                action="execute",
                duration_ms=duration_ms,
                success=False,
                error=error_msg
            )
            
            return AgentResult(
                agent_name=self.name,
                success=False,
                data=None,
                error=error_msg,
                duration_ms=duration_ms,
                metadata=self._get_metadata()
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            error_msg = str(e)
            
            self.logger.error(f"Agent {self.name} execution failed: {error_msg}", exc_info=True)
            
            log_agent_action(
                agent_name=self.name,
                action="execute",
                duration_ms=duration_ms,
                success=False,
                error=error_msg
            )
            
            return AgentResult(
                agent_name=self.name,
                success=False,
                data=None,
                error=error_msg,
                duration_ms=duration_ms,
                metadata=self._get_metadata()
            )
    
    @abstractmethod
    async def _execute(self, input_data: Any) -> T:
        """Implement the agent's core logic"""
        pass
    
    def _get_metadata(self) -> Dict[str, Any]:
        """Get agent metadata"""
        return {
            "agent_id": self.id,
            "context_keys": list(self._context.keys())
        }
    
    def set_context(self, key: str, value: Any):
        """Set context value"""
        self._context[key] = value
    
    def get_context(self, key: str, default: Any = None) -> Any:
        """Get context value"""
        return self._context.get(key, default)


class AgentOrchestrator:
    """Orchestrates multiple agents in a workflow"""
    
    def __init__(self, name: str = "orchestrator"):
        self.name = name
        self.logger = get_logger(f"orchestrator.{name}")
        self.agents: List[BaseAgent] = []
        self._context: Dict[str, Any] = {}
    
    def add_agent(self, agent: BaseAgent) -> "AgentOrchestrator":
        """Add an agent to the orchestration"""
        self.agents.append(agent)
        return self
    
    async def execute_sequential(
        self,
        initial_input: Any,
        context: Optional[Dict[str, Any]] = None
    ) -> List[AgentResult]:
        """Execute agents sequentially, passing output to next agent"""
        results = []
        current_input = initial_input
        self._context = context or {}
        
        for agent in self.agents:
            # Pass context to each agent
            agent_context = {**self._context}
            
            # Add previous results to context
            if results:
                agent_context["previous_results"] = [r.data for r in results if r.success]
            
            result = await agent.execute(current_input, agent_context)
            results.append(result)
            
            if not result.success:
                self.logger.error(f"Agent {agent.name} failed: {result.error}")
                break
            
            # Use output as input for next agent
            current_input = result.data
        
        return results
    
    async def execute_parallel(
        self,
        input_data: Any,
        context: Optional[Dict[str, Any]] = None
    ) -> List[AgentResult]:
        """Execute agents in parallel"""
        self._context = context or {}
        
        tasks = []
        for agent in self.agents:
            agent_context = {**self._context}
            tasks.append(agent.execute(input_data, agent_context))
        
        results = await asyncio.gather(*tasks)
        return list(results)
    
    async def execute_map_reduce(
        self,
        input_data: Any,
        reducer: BaseAgent,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResult:
        """Execute agents in parallel and reduce results"""
        # Map phase - execute all agents in parallel
        map_results = await self.execute_parallel(input_data, context)
        
        # Collect successful results
        successful_results = [r for r in map_results if r.success]
        
        if not successful_results:
            return AgentResult(
                agent_name="map_reduce",
                success=False,
                data=None,
                error="All map agents failed",
                duration_ms=sum(r.duration_ms for r in map_results),
                metadata={"failed_agents": [r.agent_name for r in map_results if not r.success]}
            )
        
        # Reduce phase
        reduce_input = {
            "results": [r.data for r in successful_results],
            "metadata": {r.agent_name: r.metadata for r in successful_results}
        }
        
        return await reducer.execute(reduce_input, context)


class ChainableAgent(BaseAgent[T]):
    """Agent that can be chained with other agents"""
    
    def __init__(self, name: str, timeout: int = 30):
        super().__init__(name, timeout)
        self.next_agent: Optional[BaseAgent] = None
    
    def then(self, next_agent: BaseAgent) -> BaseAgent:
        """Chain another agent after this one"""
        self.next_agent = next_agent
        return next_agent
    
    async def execute_chain(self, input_data: Any, context: Optional[Dict[str, Any]] = None) -> List[AgentResult]:
        """Execute the entire chain"""
        results = []
        current_agent = self
        current_input = input_data
        
        while current_agent:
            result = await current_agent.execute(current_input, context)
            results.append(result)
            
            if not result.success:
                break
            
            current_input = result.data
            current_agent = getattr(current_agent, 'next_agent', None)
        
        return results