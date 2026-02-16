"""
Memory-enhanced research pipeline with vector storage integration.
Phase 4: Semantic memory and knowledge base capabilities.
"""
from typing import Dict, Any, Optional, List
import time
from agents import AdvancedPlannerAgent, MemoryAgent, AgentState
from tools import SemanticScholarTool, PDFDownloaderTool, PDFParserTool
from agents.summarization_agent import SummarizationAgent
from config import settings


class MemoryEnhancedPipeline:
    """
    Research pipeline with integrated vector memory.
    
    Features:
    - Store papers in semantic memory
    - Retrieve relevant context from past research
    - Build knowledge base over time
    - Semantic search across stored papers
    - Context-aware research
    """
    
    def __init__(
        self,
        max_steps: int = 15,
        enable_memory: bool = True,
        auto_store: bool = True
    ):
        """
        Initialize memory-enhanced pipeline.
        
        Args:
            max_steps: Maximum planning steps
            enable_memory: Enable memory features
            auto_store: Automatically store researched papers
        """
        self.max_steps = max_steps
        self.enable_memory = enable_memory
        self.auto_store = auto_store
        
        # Initialize components
        self.tools = [
            SemanticScholarTool(api_key=settings.semantic_scholar_api_key),
            PDFDownloaderTool(),
            PDFParserTool()
        ]
        
        self.planner = AdvancedPlannerAgent(
            tools=self.tools,
            enable_reflection=True
        )
        
        self.summarizer = SummarizationAgent()
        
        if enable_memory:
            self.memory = MemoryAgent()
        else:
            self.memory = None
    
    async def run(
        self,
        task: str,
        use_memory_context: bool = True,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute research with memory integration.
        
        Args:
            task: Research task
            use_memory_context: Retrieve relevant papers from memory
            context: Optional additional context
            
        Returns:
            Results with memory integration
        """
        start_time = time.time()
        
        # Step 1: Retrieve relevant context from memory (if enabled)
        memory_context = []
        if self.enable_memory and use_memory_context:
            memory_context = await self._retrieve_memory_context(task)
        
        # Step 2: Execute research with planner
        state = AgentState(
            messages=[],
            current_step=0,
            max_steps=self.max_steps,
            metadata={
                "task": task,
                "context": context or {},
                "memory_context": memory_context,
                "start_time": start_time
            }
        )
        
        # Run planner loop
        while state.current_step < state.max_steps and not state.final_output and not state.error:
            state = await self.planner.process(state)
        
        # Step 3: Store results in memory (if auto_store enabled)
        stored_papers = []
        if self.enable_memory and self.auto_store and state.final_output:
            stored_papers = await self._store_research_results(state)
        
        execution_time = time.time() - start_time
        
        # Build result
        result = {
            "success": not bool(state.error),
            "task": task,
            "steps": state.current_step,
            "messages": state.messages,
            "final_output": state.final_output,
            "error": state.error,
            "execution_time_seconds": execution_time,
            "reflection": state.metadata.get("reflection"),
            "memory_context_used": len(memory_context),
            "papers_stored_in_memory": len(stored_papers),
            "memory_stats": self.memory.get_memory_stats() if self.enable_memory else None
        }
        
        return result
    
    async def run_with_summarization(
        self,
        query: str,
        num_papers: int = 5,
        store_in_memory: bool = True
    ) -> Dict[str, Any]:
        """
        Execute research with paper summarization and memory storage.
        
        Args:
            query: Research query
            num_papers: Number of papers to process
            store_in_memory: Store results in memory
            
        Returns:
            Results with summaries and memory info
        """
        start_time = time.time()
        
        # Step 1: Check memory for existing papers
        existing_papers = []
        if self.enable_memory:
            existing_papers = await self.memory.retrieve_relevant_papers(
                query=query,
                top_k=num_papers,
                min_similarity=0.7
            )
        
        # Step 2: Search for new papers
        semantic_scholar = SemanticScholarTool()
        search_result = await semantic_scholar.execute(
            query=query,
            limit=num_papers
        )
        
        if not search_result.success:
            return {
                "success": False,
                "error": search_result.error,
                "existing_papers_found": len(existing_papers)
            }
        
        # Step 3: Summarize papers
        papers = search_result.data
        summaries = []
        
        for paper in papers:
            # Summarize
            summary_state = AgentState(
                metadata={
                    "paper_data": {
                        "title": paper.get("title", ""),
                        "text": paper.get("abstract", "")
                    }
                }
            )
            
            summary_state = await self.summarizer.process(summary_state)
            
            if summary_state.final_output:
                summary = summary_state.final_output.get("summary", {})
                
                summaries.append({
                    "paper_id": paper.get("paper_id"),
                    "title": paper.get("title"),
                    "authors": paper.get("authors"),
                    "year": paper.get("year"),
                    "abstract": paper.get("abstract"),
                    "summary": summary
                })
                
                # Store in memory
                if self.enable_memory and store_in_memory:
                    await self.memory.store_paper(
                        paper_id=paper.get("paper_id", ""),
                        title=paper.get("title", ""),
                        abstract=paper.get("abstract", ""),
                        authors=paper.get("authors", []),
                        year=paper.get("year"),
                        summary=summary
                    )
        
        execution_time = time.time() - start_time
        
        return {
            "success": True,
            "query": query,
            "existing_papers_found": len(existing_papers),
            "existing_papers": existing_papers,
            "new_papers_processed": len(summaries),
            "new_papers": summaries,
            "execution_time_seconds": execution_time,
            "memory_stats": self.memory.get_memory_stats() if self.enable_memory else None
        }
    
    async def search_memory(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.5
    ) -> Dict[str, Any]:
        """
        Search memory for relevant papers.
        
        Args:
            query: Search query
            top_k: Number of results
            min_similarity: Minimum similarity threshold
            
        Returns:
            Search results
        """
        if not self.enable_memory:
            return {
                "success": False,
                "error": "Memory not enabled for this pipeline"
            }
        
        papers = await self.memory.retrieve_relevant_papers(
            query=query,
            top_k=top_k,
            min_similarity=min_similarity
        )
        
        return {
            "success": True,
            "query": query,
            "papers_found": len(papers),
            "papers": papers,
            "memory_stats": self.memory.get_memory_stats()
        }
    
    async def _retrieve_memory_context(
        self,
        task: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant papers from memory as context.
        
        Args:
            task: Research task
            top_k: Number of papers to retrieve
            
        Returns:
            List of relevant papers
        """
        if not self.memory:
            return []
        
        try:
            papers = await self.memory.retrieve_relevant_papers(
                query=task,
                top_k=top_k,
                min_similarity=0.6
            )
            return papers
        except Exception:
            return []
    
    async def _store_research_results(
        self,
        state: AgentState
    ) -> List[int]:
        """
        Store research results in memory.
        
        Args:
            state: Final agent state with results
            
        Returns:
            List of vector IDs stored
        """
        if not self.memory:
            return []
        
        vector_ids = []
        
        # Extract papers from messages
        for msg in state.messages:
            result = msg.get("result", {})
            if isinstance(result, dict) and result.get("success"):
                data = result.get("data", [])
                
                # If data is a list of papers
                if isinstance(data, list):
                    for paper in data:
                        if isinstance(paper, dict) and "title" in paper:
                            try:
                                vector_id = await self.memory.store_paper(
                                    paper_id=paper.get("paper_id", ""),
                                    title=paper.get("title", ""),
                                    abstract=paper.get("abstract", ""),
                                    authors=paper.get("authors", []),
                                    year=paper.get("year")
                                )
                                vector_ids.append(vector_id)
                            except Exception:
                                continue
        
        return vector_ids
    
    def get_memory_stats(self) -> Optional[Dict[str, Any]]:
        """
        Get memory store statistics.
        
        Returns:
            Statistics or None if memory disabled
        """
        if self.enable_memory:
            return self.memory.get_memory_stats()
        return None
    
    def clear_memory(self):
        """Clear all data from memory."""
        if self.enable_memory:
            self.memory.clear_memory()