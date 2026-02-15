"""
Semantic Scholar API tool for academic paper discovery.
Searches for papers based on query terms and returns structured results.
"""
import httpx
from typing import List, Dict, Any, Optional
from tools.base_tool import BaseTool, ToolResult


class SemanticScholarTool(BaseTool):
    """Tool for searching academic papers via Semantic Scholar API."""
    
    BASE_URL = "https://api.semanticscholar.org/graph/v1"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Semantic Scholar tool.
        
        Args:
            api_key: Optional API key for higher rate limits
        """
        self.api_key = api_key
        self.headers = {}
        if api_key:
            self.headers["x-api-key"] = api_key
    
    @property
    def name(self) -> str:
        return "semantic_scholar_search"
    
    @property
    def description(self) -> str:
        return (
            "Search for academic papers using Semantic Scholar API. "
            "Accepts a search query and returns relevant papers with metadata "
            "including title, authors, abstract, citation count, and publication year."
        )
    
    async def execute(
        self,
        query: str,
        limit: int = 10,
        fields: Optional[List[str]] = None
    ) -> ToolResult:
        """
        Search for papers on Semantic Scholar.
        
        Args:
            query: Search query string
            limit: Maximum number of results (default: 10, max: 100)
            fields: List of fields to return (default: standard set)
            
        Returns:
            ToolResult with list of papers
        """
        if not query:
            return self._error("Query parameter is required")
        
        # Default fields to retrieve
        if fields is None:
            fields = [
                "paperId",
                "title",
                "abstract",
                "authors",
                "year",
                "citationCount",
                "url",
                "venue",
                "publicationDate"
            ]
        
        # Construct API request
        params = {
            "query": query,
            "limit": min(limit, 100),  # API max is 100
            "fields": ",".join(fields)
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.BASE_URL}/paper/search",
                    params=params,
                    headers=self.headers
                )
                response.raise_for_status()
                
                data = response.json()
                papers = data.get("data", [])
                
                # Clean and structure the results
                structured_papers = self._structure_papers(papers)
                
                return self._success(
                    data=structured_papers,
                    metadata={
                        "query": query,
                        "total_results": len(structured_papers),
                        "limit": limit
                    }
                )
                
        except httpx.HTTPStatusError as e:
            return self._error(f"HTTP error occurred: {e.response.status_code}")
        except httpx.RequestError as e:
            return self._error(f"Request error occurred: {str(e)}")
        except Exception as e:
            return self._error(f"Unexpected error: {str(e)}")
    
    def _structure_papers(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Clean and structure paper data.
        
        Args:
            papers: Raw paper data from API
            
        Returns:
            List of structured paper dictionaries
        """
        structured = []
        
        for paper in papers:
            # Extract author names
            authors = [
                author.get("name", "Unknown")
                for author in paper.get("authors", [])
            ]
            
            structured_paper = {
                "paper_id": paper.get("paperId"),
                "title": paper.get("title", "No title"),
                "abstract": paper.get("abstract", "No abstract available"),
                "authors": authors,
                "year": paper.get("year"),
                "citation_count": paper.get("citationCount", 0),
                "url": paper.get("url"),
                "venue": paper.get("venue", "Unknown"),
                "publication_date": paper.get("publicationDate")
            }
            
            structured.append(structured_paper)
        
        return structured
    
    async def get_paper_details(self, paper_id: str) -> ToolResult:
        """
        Get detailed information about a specific paper.
        
        Args:
            paper_id: Semantic Scholar paper ID
            
        Returns:
            ToolResult with paper details
        """
        fields = [
            "paperId",
            "title",
            "abstract",
            "authors",
            "year",
            "citationCount",
            "url",
            "venue",
            "publicationDate",
            "references",
            "citations"
        ]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.BASE_URL}/paper/{paper_id}",
                    params={"fields": ",".join(fields)},
                    headers=self.headers
                )
                response.raise_for_status()
                
                paper = response.json()
                
                return self._success(
                    data=paper,
                    metadata={"paper_id": paper_id}
                )
                
        except httpx.HTTPStatusError as e:
            return self._error(f"HTTP error occurred: {e.response.status_code}")
        except Exception as e:
            return self._error(f"Error fetching paper details: {str(e)}")