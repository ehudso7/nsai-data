"""
Firecrawl Integration Client for NSAI Data
"""

import asyncio
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import WebScrapingError


logger = get_logger(__name__)


class FirecrawlClient:
    """Client for web scraping using Firecrawl API or fallback methods"""
    
    def __init__(self):
        self.api_key = settings.FIRECRAWL_API_KEY
        self.base_url = settings.FIRECRAWL_BASE_URL
        self.logger = logger.bind(service="firecrawl")
        self.timeout = httpx.Timeout(30.0, connect=10.0)
        
        # Headers for web scraping
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
    
    async def search(self, query: str, max_results: int = 10) -> List[Dict[str, str]]:
        """Search the web for relevant URLs"""
        try:
            # If we have Firecrawl API key, use it
            if self.api_key and self.base_url:
                return await self._firecrawl_search(query, max_results)
            else:
                # Fallback to web search simulation
                return await self._fallback_search(query, max_results)
                
        except Exception as e:
            self.logger.error(f"Search error for query '{query}': {e}")
            raise WebScrapingError(query, f"Search failed: {str(e)}")
    
    async def scrape(self, url: str) -> Dict[str, Any]:
        """Scrape content from a URL"""
        try:
            # If we have Firecrawl API key, use it
            if self.api_key and self.base_url:
                return await self._firecrawl_scrape(url)
            else:
                # Fallback to direct scraping
                return await self._fallback_scrape(url)
                
        except Exception as e:
            self.logger.error(f"Scraping error for URL '{url}': {e}")
            raise WebScrapingError(url, f"Scraping failed: {str(e)}")
    
    async def _firecrawl_search(self, query: str, max_results: int) -> List[Dict[str, str]]:
        """Search using Firecrawl API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                urljoin(self.base_url, "/v0/search"),
                headers=self.headers,
                json={"query": query, "limit": max_results}
            )
            
            if response.status_code != 200:
                raise WebScrapingError(query, f"Firecrawl API error: {response.status_code}")
            
            data = response.json()
            results = []
            
            for item in data.get("results", []):
                results.append({
                    "url": item.get("url", ""),
                    "title": item.get("title", ""),
                    "description": item.get("description", "")
                })
            
            return results
    
    async def _fallback_search(self, query: str, max_results: int) -> List[Dict[str, str]]:
        """Fallback web search simulation"""
        # In production, this would use a search API like Google Custom Search
        # For now, we'll return simulated results
        self.logger.warning("Using fallback search (no Firecrawl API key)")
        
        # Simulate search results based on query
        simulated_results = []
        
        # Add some realistic-looking results
        domains = [
            "wikipedia.org",
            "github.com",
            "stackoverflow.com",
            "medium.com",
            "dev.to"
        ]
        
        for i, domain in enumerate(domains[:max_results]):
            simulated_results.append({
                "url": f"https://{domain}/search?q={query.replace(' ', '+')}",
                "title": f"{query} - {domain.split('.')[0].title()}",
                "description": f"Information about {query} from {domain}"
            })
        
        return simulated_results
    
    async def _firecrawl_scrape(self, url: str) -> Dict[str, Any]:
        """Scrape using Firecrawl API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                urljoin(self.base_url, "/v0/scrape"),
                headers=self.headers,
                json={"url": url}
            )
            
            if response.status_code != 200:
                raise WebScrapingError(url, f"Firecrawl API error: {response.status_code}")
            
            data = response.json()
            
            return {
                "content": data.get("content", ""),
                "metadata": {
                    "title": data.get("metadata", {}).get("title", ""),
                    "description": data.get("metadata", {}).get("description", ""),
                    "image": data.get("metadata", {}).get("image", ""),
                    "author": data.get("metadata", {}).get("author", ""),
                    "published": data.get("metadata", {}).get("published", "")
                },
                "url": url
            }
    
    async def _fallback_scrape(self, url: str) -> Dict[str, Any]:
        """Fallback direct web scraping"""
        self.logger.warning(f"Using fallback scraping for {url} (no Firecrawl API key)")
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self.headers)
                
                if response.status_code != 200:
                    raise WebScrapingError(url, f"HTTP error: {response.status_code}")
                
                # Parse HTML
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract content
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Get text content
                text = soup.get_text()
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = ' '.join(chunk for chunk in chunks if chunk)
                
                # Extract metadata
                title = ""
                if soup.title:
                    title = soup.title.string
                
                description = ""
                meta_desc = soup.find("meta", attrs={"name": "description"})
                if meta_desc:
                    description = meta_desc.get("content", "")
                
                # Extract main content (heuristic approach)
                main_content = ""
                
                # Try to find main content areas
                for selector in ['main', 'article', '[role="main"]', '#content', '.content']:
                    content_elem = soup.select_one(selector)
                    if content_elem:
                        main_content = content_elem.get_text(separator=' ', strip=True)
                        break
                
                if not main_content:
                    main_content = text[:5000]  # Fallback to first 5000 chars
                
                return {
                    "content": main_content,
                    "metadata": {
                        "title": title,
                        "description": description,
                        "url": url
                    },
                    "url": url
                }
                
        except httpx.TimeoutException:
            raise WebScrapingError(url, "Request timed out")
        except Exception as e:
            raise WebScrapingError(url, f"Scraping error: {str(e)}")
    
    async def batch_scrape(self, urls: List[str], max_concurrent: int = 3) -> List[Dict[str, Any]]:
        """Scrape multiple URLs concurrently"""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def scrape_with_semaphore(url: str) -> Optional[Dict[str, Any]]:
            async with semaphore:
                try:
                    return await self.scrape(url)
                except Exception as e:
                    self.logger.error(f"Failed to scrape {url}: {e}")
                    return None
        
        tasks = [scrape_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        # Filter out failed scrapes
        return [r for r in results if r is not None]