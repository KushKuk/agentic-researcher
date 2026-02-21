"""
Cited research pipeline with retrieval-backed claim verification.
Adds source attribution to all generated summaries.
"""
from typing import Dict, Any, Optional, List
from pipelines.memory_enhanced_pipeline import MemoryEnhancedPipeline
from memory.citation_manager import CitationManager

class CitedResearchPipeline(MemoryEnhancedPipeline):
    """
    Research pipeline with automatic citation attribution.
    
    Extends MemoryEnhancedPipeline with:
    - Automatic citation of claims to source papers
    - Verification of summary against sources
    - Bibliography generation
    - Citation coverage metrics
    """
    
    def __init__(
        self,
        max_steps: int = 15,
        enable_memory: bool = True,
        auto_store: bool = True,
        min_citation_similarity: float = 0.6
    ):
        """
        Initialize cited research pipeline.
        
        Args:
            max_steps: Maximum planning steps
            enable_memory: Enable memory features
            auto_store: Automatically store researched papers
            min_citation_similarity: Minimum similarity for citation attribution
        """
        super().__init__(max_steps, enable_memory, auto_store)
        
        self.min_citation_similarity = min_citation_similarity
        
        if self.enable_memory and self.memory:
            self.citation_manager = CitationManager(
                vector_store=self.memory.vector_store
            )
        else:
            self.citation_manager = None
    
    async def run_with_citations(
        self,
        task: str,
        use_memory_context: bool = True,
        context: Optional[Dict[str, Any]] = None,
        citation_format: str = "numbered"
    ) -> Dict[str, Any]:
        """
        Execute research with automatic citation attribution.
        
        Args:
            task: Research task
            use_memory_context: Retrieve relevant papers from memory
            context: Optional additional context
            citation_format: "inline" or "numbered"
            
        Returns:
            Results with cited summary and bibliography
        """
        # Run base research pipeline
        result = await self.run(task, use_memory_context, context)
        
        if not result["success"] or not result.get("final_output"):
            return result
        
        # Extract summary text from final output
        final_output = result["final_output"]
        summary_text = self._extract_summary_text(final_output)
        
        if not summary_text or not self.citation_manager:
            return result
        
        # Add citations to summary
        citation_result = await self.citation_manager.add_citations(
            summary=summary_text,
            min_similarity=self.min_citation_similarity,
            citation_format=citation_format
        )
        
        # Generate bibliography
        bibliography = await self.citation_manager.generate_bibliography(
            citations=citation_result["citations"],
            format="apa"
        )
        
        # Enhance result with citation info
        result["cited_summary"] = citation_result["cited_text"]
        result["citations"] = citation_result["citations"]
        result["bibliography"] = bibliography
        result["citation_metrics"] = {
            "total_claims": citation_result["total_claims"],
            "cited_claims": citation_result["cited_claims"],
            "coverage": citation_result["citation_coverage"]
        }
        
        return result
    
    async def summarize_with_citations(
        self,
        query: str,
        num_papers: int = 5,
        store_in_memory: bool = True,
        citation_format: str = "numbered"
    ) -> Dict[str, Any]:
        """
        Summarize papers with citation attribution.
        
        Args:
            query: Research query
            num_papers: Number of papers to process
            store_in_memory: Store results in memory
            citation_format: "inline" or "numbered"
            
        Returns:
            Summary with citations and verification
        """
        # Run base summarization
        result = await self.run_with_summarization(
            query=query,
            num_papers=num_papers,
            store_in_memory=store_in_memory
        )
        
        if not result["success"]:
            return result
        
        # Generate overall summary from individual paper summaries
        papers = result.get("new_papers", [])
        if not papers or not self.citation_manager:
            return result
        
        # Create combined summary text
        combined_summary = self._create_combined_summary(papers)
        
        # Add citations
        citation_result = await self.citation_manager.add_citations(
            summary=combined_summary,
            min_similarity=self.min_citation_similarity,
            citation_format=citation_format
        )
        
        # Verify against source papers
        verification = await self.citation_manager.verify_summary(
            summary=combined_summary,
            source_papers=papers,
            min_similarity=self.min_citation_similarity
        )
        
        # Generate bibliography
        bibliography = await self.citation_manager.generate_bibliography(
            citations=citation_result["citations"],
            format="apa"
        )
        
        # Add citation info to result
        result["synthesis"] = {
            "cited_summary": citation_result["cited_text"],
            "citations": citation_result["citations"],
            "bibliography": bibliography,
            "verification": verification,
            "metrics": {
                "total_claims": citation_result["total_claims"],
                "cited_claims": citation_result["cited_claims"],
                "citation_coverage": citation_result["citation_coverage"],
                "verification_rate": verification["verification_rate"]
            }
        }
        
        return result
    
    async def verify_claims(
        self,
        summary: str,
        source_paper_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Verify that summary claims are backed by specified papers.
        
        Args:
            summary: Generated summary to verify
            source_paper_ids: List of paper IDs that should support the summary
            
        Returns:
            Verification report
        """
        if not self.enable_memory or not self.memory or not self.citation_manager:
            return {
                "success": False,
                "error": "Memory and citations not enabled"
            }
        
        # Retrieve source papers from memory
        source_papers = []
        for paper_id in source_paper_ids:
            papers = await self.memory.vector_store.search_by_paper_id(paper_id)
            source_papers.extend(papers)
        
        if not source_papers:
            return {
                "success": False,
                "error": "Source papers not found in memory"
            }
        
        # Run verification
        verification = await self.citation_manager.verify_summary(
            summary=summary,
            source_papers=source_papers,
            min_similarity=self.min_citation_similarity
        )
        
        return {
            "success": True,
            "verification": verification,
            "source_papers_found": len(source_papers)
        }
    
    def _extract_summary_text(self, final_output: Dict[str, Any]) -> str:
        """
        Extract summary text from final output.
        
        Args:
            final_output: Final output from research pipeline
            
        Returns:
            Summary text string
        """
        if isinstance(final_output, dict):
            # Try common summary keys
            for key in ["summary", "content", "text", "result"]:
                if key in final_output:
                    value = final_output[key]
                    if isinstance(value, str):
                        return value
                    elif isinstance(value, dict) and "summary" in value:
                        return value["summary"]
        
        # Fallback: convert to string
        return str(final_output)
    
    def _create_combined_summary(self, papers: List[Dict[str, Any]]) -> str:
        """
        Create a combined summary from multiple paper summaries.
        
        Args:
            papers: List of papers with summaries
            
        Returns:
            Combined summary text
        """
        summary_parts = []
        
        for paper in papers:
            summary = paper.get("summary", {})
            
            # Extract key findings
            if isinstance(summary, dict):
                findings = summary.get("key_findings", "")
                contributions = summary.get("contributions", "")
                
                if findings:
                    summary_parts.append(findings)
                if contributions:
                    summary_parts.append(contributions)
            elif isinstance(summary, str):
                summary_parts.append(summary)
        
        return " ".join(summary_parts)