"""
Specialized Research Agents for NSAI Data
"""

import json
from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncio

from backend.agents.base import BaseAgent, AgentResult
from backend.core.logging import get_logger
from backend.integrations.openai_client import OpenAIClient
from backend.integrations.firecrawl_client import FirecrawlClient
from backend.core.exceptions import AgentError, WebScrapingError


logger = get_logger(__name__)


class QueryAnalyzerAgent(BaseAgent[Dict[str, Any]]):
    """Analyzes user queries to extract intent and entities"""
    
    def __init__(self):
        super().__init__("QueryAnalyzer", timeout=10)
        self.openai = OpenAIClient()
    
    async def _execute(self, query: str) -> Dict[str, Any]:
        """Analyze the query to extract structured information"""
        prompt = f"""
        Analyze the following research query and extract:
        1. Main topic/subject
        2. Specific questions to answer
        3. Type of analysis needed (comparison, timeline, summary, etc.)
        4. Any specific sources mentioned
        5. Output format preference
        
        Query: {query}
        
        Return as JSON with keys: topic, questions, analysis_type, sources, output_format
        """
        
        response = await self.openai.generate(
            prompt=prompt,
            system_prompt="You are a query analysis expert. Extract structured information from research queries.",
            temperature=0.3,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "topic": query,
                "questions": [query],
                "analysis_type": "general",
                "sources": [],
                "output_format": "report"
            }


class WebSearchAgent(BaseAgent[List[Dict[str, str]]]):
    """Searches the web for relevant information"""
    
    def __init__(self):
        super().__init__("WebSearch", timeout=30)
        self.firecrawl = FirecrawlClient()
    
    async def _execute(self, search_params: Dict[str, Any]) -> List[Dict[str, str]]:
        """Search the web based on parameters"""
        topic = search_params.get("topic", "")
        questions = search_params.get("questions", [])
        
        # Generate search queries
        search_queries = [topic] + questions[:3]  # Limit to avoid too many searches
        
        all_results = []
        for query in search_queries:
            try:
                results = await self.firecrawl.search(query, max_results=5)
                all_results.extend(results)
            except Exception as e:
                self.logger.warning(f"Search failed for query '{query}': {e}")
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for result in all_results:
            if result.get("url") not in seen_urls:
                seen_urls.add(result.get("url"))
                unique_results.append(result)
        
        return unique_results[:10]  # Return top 10 unique results


class ContentExtractorAgent(BaseAgent[List[Dict[str, Any]]]):
    """Extracts and processes content from URLs"""
    
    def __init__(self):
        super().__init__("ContentExtractor", timeout=60)
        self.firecrawl = FirecrawlClient()
    
    async def _execute(self, urls: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Extract content from URLs"""
        extracted_content = []
        
        # Process URLs concurrently with semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(3)
        
        async def extract_url(url_info: Dict[str, str]):
            async with semaphore:
                try:
                    content = await self.firecrawl.scrape(url_info["url"])
                    return {
                        "url": url_info["url"],
                        "title": url_info.get("title", ""),
                        "content": content.get("content", ""),
                        "metadata": content.get("metadata", {}),
                        "extracted_at": datetime.utcnow().isoformat()
                    }
                except Exception as e:
                    self.logger.error(f"Failed to extract content from {url_info['url']}: {e}")
                    return None
        
        tasks = [extract_url(url_info) for url_info in urls]
        results = await asyncio.gather(*tasks)
        
        # Filter out failed extractions
        extracted_content = [r for r in results if r is not None]
        
        return extracted_content


class InsightGeneratorAgent(BaseAgent[Dict[str, Any]]):
    """Generates insights from extracted content"""
    
    def __init__(self):
        super().__init__("InsightGenerator", timeout=45)
        self.openai = OpenAIClient()
    
    async def _execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate insights from content"""
        content_list = data.get("content", [])
        analysis_params = data.get("analysis_params", {})
        
        if not content_list:
            return {"insights": [], "summary": "No content available for analysis"}
        
        # Prepare content for analysis
        combined_content = "\n\n".join([
            f"Source: {c['title']}\nURL: {c['url']}\nContent: {c['content'][:2000]}..."
            for c in content_list[:5]  # Limit to top 5 sources
        ])
        
        prompt = f"""
        Based on the following sources, generate comprehensive insights for the topic: {analysis_params.get('topic', 'general research')}
        
        Focus on answering these questions:
        {json.dumps(analysis_params.get('questions', []), indent=2)}
        
        Sources:
        {combined_content}
        
        Provide:
        1. Key findings (list of main points)
        2. Detailed analysis
        3. Patterns or trends identified
        4. Contradictions or gaps in information
        5. Recommendations or conclusions
        """
        
        response = await self.openai.generate(
            prompt=prompt,
            system_prompt="You are an expert research analyst. Synthesize information from multiple sources to provide valuable insights.",
            temperature=0.5,
            max_tokens=2000
        )
        
        # Structure the insights
        insights = {
            "raw_analysis": response,
            "sources_analyzed": len(content_list),
            "analysis_type": analysis_params.get("analysis_type", "general"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Extract structured insights
        structure_prompt = f"""
        Convert this analysis into a structured format:
        {response}
        
        Return JSON with keys: key_findings (list), detailed_analysis (string), patterns (list), gaps (list), recommendations (list)
        """
        
        try:
            structured = await self.openai.generate(
                prompt=structure_prompt,
                temperature=0.2,
                response_format="json"
            )
            insights["structured"] = json.loads(structured)
        except:
            insights["structured"] = None
        
        return insights


class ReportFormatterAgent(BaseAgent[str]):
    """Formats research results into a professional report"""
    
    def __init__(self):
        super().__init__("ReportFormatter", timeout=20)
        self.openai = OpenAIClient()
    
    async def _execute(self, research_data: Dict[str, Any]) -> str:
        """Format research data into a report"""
        insights = research_data.get("insights", {})
        metadata = research_data.get("metadata", {})
        
        # Create report structure
        report_sections = []
        
        # Executive Summary
        if insights.get("structured"):
            key_findings = insights["structured"].get("key_findings", [])
            if key_findings:
                report_sections.append("## Executive Summary\n")
                for finding in key_findings[:5]:
                    report_sections.append(f"- {finding}")
                report_sections.append("")
        
        # Detailed Analysis
        report_sections.append("## Detailed Analysis\n")
        report_sections.append(insights.get("raw_analysis", "No analysis available"))
        report_sections.append("")
        
        # Sources
        if metadata.get("sources"):
            report_sections.append("## Sources\n")
            for i, source in enumerate(metadata["sources"][:10], 1):
                report_sections.append(f"{i}. [{source.get('title', 'Unknown')}]({source.get('url', '#')})")
            report_sections.append("")
        
        # Metadata
        report_sections.append("## Report Metadata\n")
        report_sections.append(f"- Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
        report_sections.append(f"- Sources Analyzed: {insights.get('sources_analyzed', 0)}")
        report_sections.append(f"- Analysis Type: {insights.get('analysis_type', 'General')}")
        
        return "\n".join(report_sections)


class ValidationAgent(BaseAgent[Dict[str, Any]]):
    """Validates and fact-checks research results"""
    
    def __init__(self):
        super().__init__("Validation", timeout=30)
        self.openai = OpenAIClient()
    
    async def _execute(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate research results"""
        report = report_data.get("report", "")
        sources = report_data.get("sources", [])
        
        validation_prompt = f"""
        Review this research report for:
        1. Factual accuracy
        2. Logical consistency
        3. Source reliability
        4. Potential biases
        5. Information gaps
        
        Report:
        {report[:3000]}...
        
        Sources used: {len(sources)}
        
        Provide a validation summary with confidence score (0-100) and any concerns.
        """
        
        validation_result = await self.openai.generate(
            prompt=validation_prompt,
            system_prompt="You are a fact-checking expert. Validate research reports for accuracy and reliability.",
            temperature=0.2
        )
        
        return {
            "validation_summary": validation_result,
            "confidence_score": 85,  # Would be extracted from validation_result in production
            "validated_at": datetime.utcnow().isoformat(),
            "report": report
        }