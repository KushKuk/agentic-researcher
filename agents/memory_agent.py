"""
Memory agent for managing long-term knowledge with vector storage.
Handles storage, retrieval, and semantic search of research papers.
"""
from typing import List, Dict, Any, Optional
from agents.base_agent import BaseAgent, AgentState
from memory.vector_store import VectorMemoryStore
from config.config_settings import settings


class MemoryAgent(BaseAgent):
    """
    Agent for managing semantic memory using vector storage.
    
    Features:
    - Store papers with embeddings
    - Semantic similarity search
    - Context retrieval for tasks
    - Memory consolidation
    - Knowledge base management
    """
    
    def __init__(
        self,
        embedding_model: Optional[str] = None,
        index_path: Optional[str] = None,
        metadata_path: Optional[str] = None
    ):
        """
        Initialize memory agent.
        
        Args:
            embedding_model: Sentence transformer model name
            index_path: Path to FAISS index
            metadata_path: Path to metadata file
        """
        super().__init__(
            name="memory_agent",
            description="Manages semantic memory and retrieval using vector storage"
        )
        
        self.vector_store = VectorMemoryStore(
            embedding_model=embedding_model or settings.embedding_model,
            index_path=index_path or settings.faiss_index_path,
            metadata_path=metadata_path or settings.metadata_path
        )
    
    async def process(self, state: AgentState) -> AgentState:
        """
        Process state to store or retrieve from memory.
        
        Args:
            state: Current agent state
            
        Returns:
            Updated state with memory operation results
        """
        operation = state.metadata.get("memory_operation", "retrieve")
        
        if operation == "store":
            return await self._store_papers(state)
        elif operation == "retrieve":
            return await self._retrieve_papers(state)
        elif operation == "search":
            return await self._search_papers(state)
        else:
            state.error = f"Unknown memory operation: {operation}"
            return state
    
    async def _store_papers(self, state: AgentState) -> AgentState:
        """
        Store papers in memory.
        
        Args:
            state: State with papers to store
            
        Returns:
            Updated state
        """
        papers = state.metadata.get("papers_to_store", [])
        
        if not papers:
            state.error = "No papers provided to store"
            return state
        
        try:
            vector_ids = await self.vector_store.add_papers_batch(papers)
            
            state.final_output = {
                "operation": "store",
                "papers_stored": len(vector_ids),
                "vector_ids": vector_ids,
                "store_stats": self.vector_store.get_stats()
            }
            
        except Exception as e:
            state.error = f"Error storing papers: {str(e)}"
        
        return state
    
    async def _retrieve_papers(self, state: AgentState) -> AgentState:
        """
        Retrieve relevant papers from memory.
        
        Args:
            state: State with retrieval query
            
        Returns:
            Updated state with retrieved papers
        """
        query = state.metadata.get("query", "")
        top_k = state.metadata.get("top_k", 5)
        min_similarity = state.metadata.get("min_similarity", 0.5)
        
        if not query:
            state.error = "No query provided for retrieval"
            return state
        
        try:
            results = await self.vector_store.search_similar(
                query=query,
                top_k=top_k,
                min_similarity=min_similarity
            )
            
            # Format results
            papers = []
            for vector_id, score, metadata in results:
                papers.append({
                    "vector_id": vector_id,
                    "similarity_score": score,
                    "paper_id": metadata.get("paper_id"),
                    "title": metadata.get("title"),
                    "authors": metadata.get("authors"),
                    "year": metadata.get("year"),
                    "abstract": metadata.get("abstract"),
                    "summary": metadata.get("summary")
                })
            
            state.final_output = {
                "operation": "retrieve",
                "query": query,
                "papers_found": len(papers),
                "papers": papers
            }
            
        except Exception as e:
            state.error = f"Error retrieving papers: {str(e)}"
        
        return state
    
    async def _search_papers(self, state: AgentState) -> AgentState:
        """
        Search for similar papers by paper ID.
        
        Args:
            state: State with paper ID to search
            
        Returns:
            Updated state with similar papers
        """
        paper_id = state.metadata.get("paper_id", "")
        top_k = state.metadata.get("top_k", 5)
        
        if not paper_id:
            state.error = "No paper_id provided for search"
            return state
        
        try:
            results = await self.vector_store.search_by_paper_id(
                paper_id=paper_id,
                top_k=top_k
            )
            
            papers = []
            for vector_id, score, metadata in results[1:]:
                papers.append({
                    "vector_id": vector_id,
                    "similarity_score": score,
                    "paper_id": metadata.get("paper_id"),
                    "title": metadata.get("title"),
                    "authors": metadata.get("authors"),
                    "year": metadata.get("year")
                })
            
            state.final_output = {
                "operation": "search_similar",
                "query_paper_id": paper_id,
                "similar_papers_found": len(papers),
                "papers": papers
            }
            
        except Exception as e:
            state.error = f"Error searching papers: {str(e)}"
        
        return state
    
    async def store_paper(
        self,
        paper_id: str,
        title: str,
        abstract: str,
        authors: List[str],
        year: Optional[int] = None,
        summary: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Store a single paper in memory.
        
        Args:
            paper_id: Paper identifier
            title: Paper title
            abstract: Paper abstract
            authors: Author list
            year: Publication year
            summary: Optional structured summary
            
        Returns:
            Vector ID assigned
        """
        return await self.vector_store.add_paper(
            paper_id=paper_id,
            title=title,
            abstract=abstract,
            authors=authors,
            year=year,
            summary=summary
        )
    
    async def retrieve_relevant_papers(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve papers relevant to a query.
        
        Args:
            query: Search query
            top_k: Number of results
            min_similarity: Minimum similarity threshold
            
        Returns:
            List of relevant papers with metadata
        """
        results = await self.vector_store.search_similar(
            query=query,
            top_k=top_k,
            min_similarity=min_similarity
        )
        
        papers = []
        for vector_id, score, metadata in results:
            papers.append({
                "vector_id": vector_id,
                "similarity_score": score,
                **metadata
            })
        
        return papers
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the memory store.
        
        Returns:
            Statistics dictionary
        """
        return self.vector_store.get_stats()
    
    def clear_memory(self):
        """Clear all data from memory."""
        self.vector_store.clear()