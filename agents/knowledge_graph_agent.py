"""
Knowledge graph agent for building and querying research knowledge graphs.
Orchestrates entity extraction, graph population, and graph queries.
"""
from typing import List, Dict, Any, Optional
from agents.base_agent import BaseAgent, AgentState
from graph.knowledge_graph import KnowledgeGraphManager
from graph.entity_extractor import EntityExtractor


class KnowledgeGraphAgent(BaseAgent):
    """
    Agent for building and querying the Neo4j knowledge graph.

    Capabilities:
    - Ingest papers → extract entities → populate graph
    - Query paper-concept relationships
    - Query author collaboration networks
    - Query citation chains
    - Surface trending concepts
    """

    def __init__(
        self,
        neo4j_uri: Optional[str] = None,
        neo4j_user: Optional[str] = None,
        neo4j_password: Optional[str] = None
    ):
        super().__init__(
            name="knowledge_graph_agent",
            description="Builds and queries a Neo4j knowledge graph of research papers"
        )
        self.graph = KnowledgeGraphManager(
            uri=neo4j_uri,
            user=neo4j_user,
            password=neo4j_password
        )
        self.extractor = EntityExtractor()

    async def connect(self):
        """Open the Neo4j connection."""
        await self.graph.connect()

    async def close(self):
        """Close the Neo4j connection."""
        await self.graph.close()

    # ─── BaseAgent interface ─────────────────────────────────────────────────────

    async def process(self, state: AgentState) -> AgentState:
        """
        Route to the correct operation based on state metadata.

        Supported operations:
        - "ingest"  : Add papers to the graph
        - "query"   : Run a named graph query
        - "stats"   : Return graph statistics
        """
        operation = state.metadata.get("graph_operation", "stats")

        await self.connect()
        try:
            if operation == "ingest":
                state = await self._ingest_papers(state)
            elif operation == "query":
                state = await self._run_query(state)
            elif operation == "stats":
                state = await self._get_stats(state)
            else:
                state.error = f"Unknown graph_operation: {operation}"
        finally:
            await self.close()

        return state

    # ─── Ingest ──────────────────────────────────────────────────────────────────

    async def _ingest_papers(self, state: AgentState) -> AgentState:
        """Add papers from state.metadata['papers'] into the graph."""
        papers = state.metadata.get("papers", [])
        if not papers:
            state.error = "No papers provided for ingestion"
            return state

        results = await self.ingest_papers(papers)
        state.final_output = {
            "operation": "ingest",
            "papers_ingested": results["papers_added"],
            "entities_extracted": results["entities"],
            "relationships_created": results["relationships"]
        }
        return state

    async def ingest_papers(self, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Full ingestion pipeline for a list of papers.

        For each paper:
        1. Add Paper node
        2. Extract entities with EntityExtractor
        3. Add Author / Concept / Venue nodes
        4. Create all relationships

        Returns:
            Summary dict with counts
        """
        await self.connect()

        total_entities = 0
        total_relationships = 0

        try:
            # Bulk-add paper nodes first
            await self.graph.add_papers_batch(papers)

            for paper in papers:
                paper_id = paper.get("paper_id", "")
                title    = paper.get("title", "")
                abstract = paper.get("abstract", "")
                authors  = paper.get("authors", [])
                venue    = paper.get("venue", "")

                # Authors
                for author in authors:
                    await self.graph.add_author(author)
                    await self.graph.link_paper_author(paper_id, author)
                    total_relationships += 1

                # Venue
                if venue:
                    await self.graph.add_venue(venue)
                    await self.graph.link_paper_venue(paper_id, venue)
                    total_relationships += 1

                # Entity / concept extraction
                if title or abstract:
                    entities = await self.extractor.extract_from_paper(title, abstract)
                    total_entities += sum(len(v) for v in entities.values())

                    for concept in entities.get("concepts", []):
                        await self.graph.add_concept(concept, "research_area")
                        await self.graph.link_paper_concept(paper_id, concept)
                        total_relationships += 1

                    for method in entities.get("methods", []):
                        await self.graph.add_concept(method, "method")
                        await self.graph.link_paper_concept(paper_id, method, weight=0.8)
                        total_relationships += 1

                    for task in entities.get("tasks", []):
                        await self.graph.add_concept(task, "task")
                        await self.graph.link_paper_concept(paper_id, task, weight=0.9)
                        total_relationships += 1

        finally:
            await self.close()

        return {
            "papers_added": len(papers),
            "entities": total_entities,
            "relationships": total_relationships
        }

    # ─── Query routing ───────────────────────────────────────────────────────────

    async def _run_query(self, state: AgentState) -> AgentState:
        """Execute a named graph query and store result in state.final_output."""
        query_type = state.metadata.get("query_type", "")
        params     = state.metadata.get("query_params", {})

        query_map = {
            "papers_by_concept":  self._query_papers_by_concept,
            "papers_by_author":   self._query_papers_by_author,
            "author_network":     self._query_author_network,
            "citation_network":   self._query_citation_network,
            "top_concepts":       self._query_top_concepts,
            "related_concepts":   self._query_related_concepts,
            "search_papers":      self._query_search_papers,
            "prolific_authors":   self._query_prolific_authors,
        }

        handler = query_map.get(query_type)
        if not handler:
            state.error = f"Unknown query_type: {query_type}. Options: {list(query_map)}"
            return state

        result = await handler(params)
        state.final_output = {"query_type": query_type, "results": result}
        return state

    async def _query_papers_by_concept(self, params: Dict) -> List[Dict]:
        return await self.graph.get_papers_by_concept(
            params.get("concept", ""), params.get("limit", 10)
        )

    async def _query_papers_by_author(self, params: Dict) -> List[Dict]:
        return await self.graph.get_papers_by_author(
            params.get("author", ""), params.get("limit", 10)
        )

    async def _query_author_network(self, params: Dict) -> Dict:
        return await self.graph.get_author_network(
            params.get("author", ""), params.get("depth", 2)
        )

    async def _query_citation_network(self, params: Dict) -> Dict:
        return await self.graph.get_citation_network(
            params.get("paper_id", ""), params.get("depth", 2)
        )

    async def _query_top_concepts(self, params: Dict) -> List[Dict]:
        return await self.graph.get_top_concepts(params.get("limit", 20))

    async def _query_related_concepts(self, params: Dict) -> List[Dict]:
        return await self.graph.get_related_concepts(
            params.get("concept", ""), params.get("limit", 10)
        )

    async def _query_search_papers(self, params: Dict) -> List[Dict]:
        return await self.graph.search_papers(
            params.get("keyword", ""), params.get("limit", 10)
        )

    async def _query_prolific_authors(self, params: Dict) -> List[Dict]:
        return await self.graph.get_prolific_authors(params.get("limit", 10))

    # ─── Stats ───────────────────────────────────────────────────────────────────

    async def _get_stats(self, state: AgentState) -> AgentState:
        stats = await self.graph.get_graph_stats()
        state.final_output = {"operation": "stats", "graph_stats": stats}
        return state

    async def get_stats(self) -> Dict[str, Any]:
        """Public helper – connect, fetch stats, close."""
        await self.connect()
        try:
            return await self.graph.get_graph_stats()
        finally:
            await self.close()