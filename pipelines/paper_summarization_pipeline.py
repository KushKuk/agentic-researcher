"""
Enhanced research pipeline with paper summarization capabilities.
Orchestrates paper discovery, download, parsing, and summarization.
"""
from typing import Dict, Any, Optional
from agents.planner_agent import PlannerAgent,AgentState
from agents.summarization_agent import SummarizationAgent
from tools.semantic_scholar_tool import SemanticScholarTool
from tools.pdf_downloader_tool import PDFDownloaderTool
from tools.pdf_parser_tool import PDFParserTool
from config.config_settings import settings


class PaperSummarizationPipeline:
    """
    Pipeline for discovering papers and generating summaries.
    
    Workflow:
    1. Search for papers using Semantic Scholar
    2. Download PDFs (if available)
    3. Parse PDFs and extract text
    4. Generate structured summaries using LLM
    """
    
    def __init__(self, max_steps: int = 10, download_dir: str = "./data/pdfs"):
        """
        Initialize paper summarization pipeline.
        
        Args:
            max_steps: Maximum steps for planner agent
            download_dir: Directory for downloaded PDFs
        """
        self.max_steps = max_steps
        self.download_dir = download_dir
        
        # Initialize tools
        self.semantic_scholar = SemanticScholarTool(
            api_key=settings.semantic_scholar_api_key
        )
        self.pdf_downloader = PDFDownloaderTool(download_dir=download_dir)
        self.pdf_parser = PDFParserTool()
        
        # Initialize agents
        self.planner = PlannerAgent(
            tools=[self.semantic_scholar, self.pdf_downloader, self.pdf_parser]
        )
        self.summarizer = SummarizationAgent()
    
    async def run(
        self,
        query: str,
        num_papers: int = 3,
        summarize: bool = True
    ) -> Dict[str, Any]:
        """
        Execute the full pipeline.
        
        Args:
            query: Search query for papers
            num_papers: Number of papers to process
            summarize: Whether to generate summaries
            
        Returns:
            Results dictionary with papers and summaries
        """
        results = {
            "query": query,
            "papers": [],
            "summaries": [],
            "errors": []
        }
        
        try:
            # Step 1: Search for papers
            search_result = await self.semantic_scholar.execute(
                query=query,
                limit=num_papers
            )
            
            if not search_result.success:
                results["errors"].append(f"Search failed: {search_result.error}")
                return results
            
            papers = search_result.data
            results["papers"] = papers
            
            # Step 2-4: For each paper, try to download, parse, and summarize
            for i, paper in enumerate(papers[:num_papers]):
                paper_result = await self._process_paper(paper, summarize)
                
                if paper_result:
                    results["summaries"].append(paper_result)
            
            return results
            
        except Exception as e:
            results["errors"].append(f"Pipeline error: {str(e)}")
            return results
    
    async def _process_paper(
        self,
        paper: Dict[str, Any],
        summarize: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Process a single paper: download, parse, and summarize.
        
        Args:
            paper: Paper metadata from Semantic Scholar
            summarize: Whether to generate summary
            
        Returns:
            Processed paper data with summary, or None if failed
        """
        result = {
            "paper_id": paper.get("paper_id"),
            "title": paper.get("title"),
            "authors": paper.get("authors"),
            "year": paper.get("year"),
            "abstract": paper.get("abstract"),
            "url": paper.get("url"),
            "downloaded": False,
            "parsed": False,
            "summary": None,
            "error": None
        }
        
        try:
            # Try to download PDF if URL available
            pdf_url = paper.get("url")
            if pdf_url and ".pdf" in pdf_url.lower():
                download_result = await self.pdf_downloader.execute(
                    url=pdf_url,
                    filename=f"{paper.get('paper_id', 'paper')}.pdf"
                )
                
                if download_result.success:
                    result["downloaded"] = True
                    file_path = download_result.data["file_path"]
                    
                    # Parse PDF
                    parse_result = await self.pdf_parser.execute(
                        file_path=file_path,
                        max_pages=20  # Limit pages for efficiency
                    )
                    
                    if parse_result.success:
                        result["parsed"] = True
                        paper_text = parse_result.data["full_text"]
                        
                        # Summarize if requested
                        if summarize:
                            summary = await self._summarize_paper(
                                title=paper.get("title", "Unknown"),
                                text=paper_text,
                                abstract=paper.get("abstract")
                            )
                            result["summary"] = summary
            
            # If PDF not available or download failed, summarize from abstract
            elif summarize and paper.get("abstract"):
                summary = await self._summarize_paper(
                    title=paper.get("title", "Unknown"),
                    text=paper.get("abstract", ""),
                    abstract=paper.get("abstract")
                )
                result["summary"] = summary
            
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _summarize_paper(
        self,
        title: str,
        text: str,
        abstract: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate summary for a paper.
        
        Args:
            title: Paper title
            text: Paper text (full or abstract)
            abstract: Optional separate abstract
            
        Returns:
            Summary dictionary
        """
        try:
            if abstract and len(text) > len(abstract) * 2:
                # Use abstract + full text
                summary = await self.summarizer.summarize_with_abstract(
                    title=title,
                    abstract=abstract,
                    full_text=text
                )
            else:
                # Use available text
                state = AgentState(
                    metadata={
                        "paper_data": {
                            "title": title,
                            "text": text
                        }
                    }
                )
                
                result_state = await self.summarizer.process(state)
                
                if result_state.final_output:
                    summary = result_state.final_output.get("summary", {})
                else:
                    summary = {"error": result_state.error}
            
            return summary
            
        except Exception as e:
            return {"error": str(e)}
    
    async def summarize_from_url(self, pdf_url: str, title: str = "Unknown") -> Dict[str, Any]:
        """
        Download and summarize a paper from a direct PDF URL.
        
        Args:
            pdf_url: Direct URL to PDF
            title: Paper title
            
        Returns:
            Summary result
        """
        try:
            # Download
            download_result = await self.pdf_downloader.execute(url=pdf_url)
            if not download_result.success:
                return {"error": f"Download failed: {download_result.error}"}
            
            # Parse
            file_path = download_result.data["file_path"]
            parse_result = await self.pdf_parser.execute(file_path=file_path)
            if not parse_result.success:
                return {"error": f"Parse failed: {parse_result.error}"}
            
            # Summarize
            text = parse_result.data["full_text"]
            state = AgentState(
                metadata={
                    "paper_data": {
                        "title": title,
                        "text": text
                    }
                }
            )
            
            result_state = await self.summarizer.process(state)
            
            if result_state.final_output:
                return {
                    "success": True,
                    "summary": result_state.final_output.get("summary"),
                    "file_path": file_path
                }
            else:
                return {"error": result_state.error}
                
        except Exception as e:
            return {"error": str(e)}