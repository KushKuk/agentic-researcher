"""
Knowledge graph pipeline – Phase 5.
Searches for papers, stores them in vector memory, and populates the Neo4j graph.
"""
from typing import Dict, Any, List, Optional
import time

from agents.knowledge_graph_agent import KnowledgeGraphAgent
from pipelines.memory_enhanced_pipeline import MemoryEnhancedPipeline
from tools.semantic_scholar_tool import SemanticScholarTool
from config.settings import settings


class KnowledgeGraphPipeline:
    """
    Full pipeline that:
    1. Searches for papers (Semantic Scholar)
    2. Stores paper embeddings in FAISS (Phase 4)
    3. Extracts entities and populates Neo4j (Phase 5)
    4. Enables rich graph queries
    """

    def __init__(
        self,
        enable_memory: bool = True,
        neo4j_uri: Optional[str] = None,
        neo4j_user: Optional[str] = None,
        neo4j_password: Optional[str] = None,
    ):
        self.enable_memory = enable_memory
        self.memory_pipeline: Optional[MemoryEnhancedPipeline] = None

        self.semantic_scholar = SemanticScholarTool(
            api_key=settings.semantic_scholar_api_key
        )
        self.kg_agent = KnowledgeGraphAgent(
            neo4j_uri=neo4j_uri,
            neo4j_user=neo4j_user,
            neo4j_password=neo4j_password,
        )
        if enable_memory:
            self.memory_pipeline = MemoryEnhancedPipeline(
                enable_memory=True,
                auto_store=True
            )

    # ─── Main entry points ────────────────────────────────────────────────────────

    async def run(
        self,
        query: str,
        num_papers: int = 10,
        store_in_memory: bool = True,
        build_graph: bool = True,
    ) -> Dict[str, Any]:
        """
        Full pipeline: search → memory → graph.

        Args:
            query:          Search query string
            num_papers:     How many papers to pull
            store_in_memory: Store embeddings in FAISS
            build_graph:    Populate Neo4j knowledge graph

        Returns:
            Result dict with paper list, memory info, and graph stats
        """
        start = time.time()

        # ── 1. Search papers ──────────────────────────────────────────────────
        search_result = await self.semantic_scholar.execute(
            query=query, limit=num_papers
        )
        if not search_result.success:
            return {"success": False, "error": search_result.error}

        papers: List[Dict[str, Any]] = search_result.data

        # ── 2. Store in vector memory ─────────────────────────────────────────
        memory_result: Dict[str, Any] = {}
        if store_in_memory and self.enable_memory:
            memory_result = await self._store_in_memory(papers)

        # ── 3. Build knowledge graph ──────────────────────────────────────────
        graph_result: Dict[str, Any] = {}
        if build_graph:
            graph_result = await self.kg_agent.ingest_papers(papers)

        elapsed = time.time() - start

        return {
            "success": True,
            "query": query,
            "papers_found": len(papers),
            "papers": papers,
            "memory": memory_result,
            "graph": graph_result,
            "execution_time_seconds": elapsed,
        }

    async def query_graph(
        self,
        query_type: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a named graph query.

        Args:
            query_type: One of:
                papers_by_concept | papers_by_author | author_network |
                citation_network  | top_concepts     | related_concepts |
                search_papers     | prolific_authors
            params: Query parameters (concept, author, paper_id, limit, …)

        Returns:
            Query results dict
        """
        await self.kg_agent.connect()
        try:
            query_map = {
                "papers_by_concept": self.kg_agent._query_papers_by_concept,
                "papers_by_author":  self.kg_agent._query_papers_by_author,
                "author_network":    self.kg_agent._query_author_network,
                "citation_network":  self.kg_agent._query_citation_network,
                "top_concepts":      self.kg_agent._query_top_concepts,
                "related_concepts":  self.kg_agent._query_related_concepts,
                "search_papers":     self.kg_agent._query_search_papers,
                "prolific_authors":  self.kg_agent._query_prolific_authors,
            }

            handler = query_map.get(query_type)
            if not handler:
                return {"success": False, "error": f"Unknown query_type: {query_type}"}

            results = await handler(params or {})
            return {"success": True, "query_type": query_type, "results": results}
        finally:
            await self.kg_agent.close()

    async def get_graph_stats(self) -> Dict[str, Any]:
        """Return current graph statistics."""
        stats = await self.kg_agent.get_stats()
        return {"success": True, "stats": stats}

    async def ingest_papers_directly(
        self, papers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Directly ingest a list of paper dicts into the graph
        (skips the Semantic Scholar search step).
        """
        result = await self.kg_agent.ingest_papers(papers)
        return {"success": True, "ingestion": result}

    # ─── Private helpers ──────────────────────────────────────────────────────────

    async def _store_in_memory(
        self, papers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Store papers in FAISS vector store via MemoryEnhancedPipeline."""
        if not self.enable_memory or self.memory_pipeline is None:
            return {"error": "Memory not enabled", "papers_stored": 0}
        
        try:
            # Assert not None for type checker
            assert self.memory_pipeline is not None
            assert self.memory_pipeline.memory is not None
            
            vector_ids = await self.memory_pipeline.memory.vector_store.add_papers_batch(papers)
            return {
                "papers_stored": len(vector_ids),
                "vector_ids": vector_ids,
                "stats": self.memory_pipeline.get_memory_stats(),
            }
        except Exception as e:
            return {"error": str(e), "papers_stored": 0}