"""
OpenAI Integration Client for NSAI Data
"""

import asyncio
from typing import Any, Dict, List, Optional, Union
import json

import openai
from openai import AsyncOpenAI
import tiktoken

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import AIServiceError


logger = get_logger(__name__)


class OpenAIClient:
    """Client for interacting with OpenAI API"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
        self.logger = logger.bind(service="openai")
        
        # Token counter
        try:
            self.encoding = tiktoken.encoding_for_model(self.model)
        except:
            self.encoding = tiktoken.get_encoding("cl100k_base")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[str] = None,
        **kwargs
    ) -> str:
        """Generate text using OpenAI"""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            # Calculate tokens
            prompt_tokens = self._count_tokens(messages)
            max_response_tokens = min(
                max_tokens or self.max_tokens,
                self.max_tokens - prompt_tokens - 100  # Safety margin
            )
            
            self.logger.info(
                "Generating response",
                prompt_tokens=prompt_tokens,
                max_tokens=max_response_tokens
            )
            
            # Prepare request parameters
            request_params = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature or self.temperature,
                "max_tokens": max_response_tokens,
                **kwargs
            }
            
            # Add response format if specified
            if response_format == "json":
                request_params["response_format"] = {"type": "json_object"}
            
            # Make API call
            response = await self.client.chat.completions.create(**request_params)
            
            content = response.choices[0].message.content
            
            # Log usage
            if response.usage:
                self.logger.info(
                    "OpenAI usage",
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens
                )
            
            return content
            
        except openai.APIError as e:
            self.logger.error(f"OpenAI API error: {e}")
            raise AIServiceError("OpenAI", f"API error: {str(e)}")
        except openai.APIConnectionError as e:
            self.logger.error(f"OpenAI connection error: {e}")
            raise AIServiceError("OpenAI", "Connection error")
        except openai.RateLimitError as e:
            self.logger.error(f"OpenAI rate limit error: {e}")
            raise AIServiceError("OpenAI", "Rate limit exceeded")
        except Exception as e:
            self.logger.error(f"Unexpected OpenAI error: {e}", exc_info=True)
            raise AIServiceError("OpenAI", f"Unexpected error: {str(e)}")
    
    async def generate_structured(
        self,
        prompt: str,
        schema: Dict[str, Any],
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate structured output matching a schema"""
        schema_prompt = f"""
        {prompt}
        
        Return your response as valid JSON matching this schema:
        {json.dumps(schema, indent=2)}
        """
        
        response = await self.generate(
            prompt=schema_prompt,
            system_prompt=system_prompt or "You are a helpful assistant that always returns valid JSON.",
            temperature=0.2,
            response_format="json",
            **kwargs
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            self.logger.error(f"Failed to parse JSON response: {response}")
            raise AIServiceError("OpenAI", "Invalid JSON response")
    
    async def embeddings(
        self,
        texts: Union[str, List[str]],
        model: str = "text-embedding-3-small"
    ) -> List[List[float]]:
        """Generate embeddings for text"""
        if isinstance(texts, str):
            texts = [texts]
        
        try:
            response = await self.client.embeddings.create(
                model=model,
                input=texts
            )
            
            return [embedding.embedding for embedding in response.data]
            
        except Exception as e:
            self.logger.error(f"Embedding error: {e}", exc_info=True)
            raise AIServiceError("OpenAI", f"Embedding error: {str(e)}")
    
    async def moderate(self, text: str) -> Dict[str, Any]:
        """Check content for policy violations"""
        try:
            response = await self.client.moderations.create(input=text)
            
            result = response.results[0]
            
            return {
                "flagged": result.flagged,
                "categories": {
                    category: getattr(result.categories, category)
                    for category in dir(result.categories)
                    if not category.startswith('_')
                },
                "scores": {
                    category: getattr(result.category_scores, category)
                    for category in dir(result.category_scores)
                    if not category.startswith('_')
                }
            }
            
        except Exception as e:
            self.logger.error(f"Moderation error: {e}", exc_info=True)
            # Don't fail on moderation errors
            return {"flagged": False, "categories": {}, "scores": {}}
    
    def _count_tokens(self, messages: List[Dict[str, str]]) -> int:
        """Count tokens in messages"""
        try:
            # Approximate token count
            text = " ".join([m["content"] for m in messages])
            return len(self.encoding.encode(text))
        except:
            # Fallback to rough estimate
            return len(" ".join([m["content"] for m in messages])) // 4
    
    async def stream_generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs
    ):
        """Stream generate text using OpenAI"""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            self.logger.error(f"Stream generation error: {e}", exc_info=True)
            raise AIServiceError("OpenAI", f"Stream error: {str(e)}")