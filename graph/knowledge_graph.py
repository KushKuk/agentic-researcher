"""
Neo4j knowledge graph manager for research entities and relationships.
Handles papers, authors, concepts, and their connections.
"""
from typing import List, Dict, Any, Optional, cast, TYPE_CHECKING
from neo4j import AsyncGraphDatabase, AsyncDriver
from config.settings import settings

if TYPE_CHECKING:
    from typing import LiteralString


class KnowledgeGraphManager:
    """
    Manages the Neo4j knowledge graph for research data.
    
    Node Types:
    - Paper: Academic papers with metadata
    - Author: Researchers and academics
    - Concept: Research topics and keywords
    - Venue: Journals and conferences
    
    Relationship Types:
    - AUTHORED_BY: Paper → Author
    - CITES: Paper → Paper
    - COVERS: Paper → Concept
    - PUBLISHED_IN: Paper → Venue
    - COLLABORATES_WITH: Author → Author
    - RELATED_TO: Concept → Concept
    """

    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None
    ):
        self.uri: str = uri or settings.neo4j_uri
        self.user: str = user or settings.neo4j_user
        self.password: str = password or settings.neo4j_password
        self._driver: Optional[AsyncDriver] = None

    async def connect(self):
        """Open the async Neo4j driver."""
        self._driver = AsyncGraphDatabase.driver(
            self.uri,
            auth=(self.user, self.password)
        )
        await self._driver.verify_connectivity()
        await self._create_constraints()

    async def close(self):
        """Close the driver."""
        if self._driver:
            await self._driver.close()

    @property
    def driver(self) -> AsyncDriver:
        """Get the driver, asserting it's connected."""
        assert self._driver is not None, "Driver not connected. Call await connect() first."
        return self._driver

    async def _create_constraints(self):
        """Create uniqueness constraints and indexes."""
        queries = [
            "CREATE CONSTRAINT paper_id IF NOT EXISTS FOR (p:Paper) REQUIRE p.paper_id IS UNIQUE",
            "CREATE CONSTRAINT author_name IF NOT EXISTS FOR (a:Author) REQUIRE a.name IS UNIQUE",
            "CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE",
            "CREATE CONSTRAINT venue_name IF NOT EXISTS FOR (v:Venue) REQUIRE v.name IS UNIQUE",
            "CREATE INDEX paper_year IF NOT EXISTS FOR (p:Paper) ON (p.year)",
            "CREATE INDEX paper_title IF NOT EXISTS FOR (p:Paper) ON (p.title)",
        ]
        async with self.driver.session() as session:
            for query in queries:
                try:
                    await session.run(cast("LiteralString", query))
                except Exception:
                    pass  # Constraint may already exist

    # ─── Paper Operations ───────────────────────────────────────────────────────

    async def add_paper(self, paper: Dict[str, Any]) -> bool:
        """
        Add or update a paper node.

        Args:
            paper: Paper metadata dict with keys:
                   paper_id, title, abstract, year, citation_count, url

        Returns:
            True on success
        """
        query = """
        MERGE (p:Paper {paper_id: $paper_id})
        SET p.title         = $title,
            p.abstract      = $abstract,
            p.year          = $year,
            p.citation_count= $citation_count,
            p.url           = $url
        RETURN p
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                paper_id=paper.get("paper_id", ""),
                title=paper.get("title", ""),
                abstract=paper.get("abstract", ""),
                year=paper.get("year"),
                citation_count=paper.get("citation_count", 0),
                url=paper.get("url", "")
            )
        return True

    async def add_papers_batch(self, papers: List[Dict[str, Any]]) -> int:
        """
        Add multiple papers using UNWIND for efficiency.

        Returns:
            Number of papers added
        """
        query = """
        UNWIND $papers AS p
        MERGE (paper:Paper {paper_id: p.paper_id})
        SET paper.title          = p.title,
            paper.abstract       = p.abstract,
            paper.year           = p.year,
            paper.citation_count = p.citation_count,
            paper.url            = p.url
        """
        async with self.driver.session() as session:
            await session.run(cast("LiteralString", query), papers=papers)
        return len(papers)

    async def get_paper(self, paper_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a paper node by ID."""
        query = "MATCH (p:Paper {paper_id: $paper_id}) RETURN p"
        async with self.driver.session() as session:
            result = await session.run(cast("LiteralString", query), paper_id=paper_id)
            record = await result.single()
            return dict(record["p"]) if record else None

    # ─── Author Operations ───────────────────────────────────────────────────────

    async def add_author(self, name: str, affiliations: Optional[List[str]] = None) -> bool:
        """Add or update an author node."""
        query = """
        MERGE (a:Author {name: $name})
        SET a.affiliations = $affiliations
        RETURN a
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                name=name,
                affiliations=affiliations or []
            )
        return True

    # ─── Concept Operations ──────────────────────────────────────────────────────

    async def add_concept(self, name: str, category: Optional[str] = None) -> bool:
        """Add or update a concept/topic node."""
        query = """
        MERGE (c:Concept {name: $name})
        SET c.category = $category
        RETURN c
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                name=name,
                category=category or "general"
            )
        return True

    # ─── Venue Operations ────────────────────────────────────────────────────────

    async def add_venue(self, name: str, venue_type: Optional[str] = None) -> bool:
        """Add or update a venue node."""
        query = """
        MERGE (v:Venue {name: $name})
        SET v.type = $venue_type
        RETURN v
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                name=name,
                venue_type=venue_type or "unknown"
            )
        return True

    # ─── Relationship Operations ─────────────────────────────────────────────────

    async def link_paper_author(self, paper_id: str, author_name: str) -> bool:
        """Create AUTHORED_BY relationship between Paper and Author."""
        query = """
        MATCH (p:Paper {paper_id: $paper_id})
        MERGE (a:Author {name: $author_name})
        MERGE (p)-[:AUTHORED_BY]->(a)
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                paper_id=paper_id,
                author_name=author_name
            )
        return True

    async def link_paper_concept(self, paper_id: str, concept_name: str, weight: float = 1.0) -> bool:
        """Create COVERS relationship between Paper and Concept."""
        query = """
        MATCH (p:Paper {paper_id: $paper_id})
        MERGE (c:Concept {name: $concept_name})
        MERGE (p)-[r:COVERS]->(c)
        SET r.weight = $weight
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                paper_id=paper_id,
                concept_name=concept_name,
                weight=weight
            )
        return True

    async def link_paper_citation(self, citing_id: str, cited_id: str) -> bool:
        """Create CITES relationship between two papers."""
        query = """
        MATCH (a:Paper {paper_id: $citing_id})
        MATCH (b:Paper {paper_id: $cited_id})
        MERGE (a)-[:CITES]->(b)
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                citing_id=citing_id,
                cited_id=cited_id
            )
        return True

    async def link_paper_venue(self, paper_id: str, venue_name: str) -> bool:
        """Create PUBLISHED_IN relationship between Paper and Venue."""
        query = """
        MATCH (p:Paper {paper_id: $paper_id})
        MERGE (v:Venue {name: $venue_name})
        MERGE (p)-[:PUBLISHED_IN]->(v)
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                paper_id=paper_id,
                venue_name=venue_name
            )
        return True

    async def link_concepts(self, concept_a: str, concept_b: str) -> bool:
        """Create RELATED_TO relationship between two concepts."""
        query = """
        MERGE (a:Concept {name: $concept_a})
        MERGE (b:Concept {name: $concept_b})
        MERGE (a)-[:RELATED_TO]->(b)
        """
        async with self.driver.session() as session:
            await session.run(
                cast("LiteralString", query),
                concept_a=concept_a,
                concept_b=concept_b
            )
        return True

    # ─── Query Operations ─────────────────────────────────────────────────────────

    async def get_papers_by_concept(self, concept: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Find papers that cover a given concept."""
        query = """
        MATCH (p:Paper)-[:COVERS]->(c:Concept)
        WHERE toLower(c.name) CONTAINS toLower($concept)
        RETURN p
        ORDER BY p.citation_count DESC
        LIMIT $limit
        """
        async with self.driver.session() as session:
            result = await session.run(
                cast("LiteralString", query),
                concept=concept,
                limit=limit
            )
            records = await result.data()
            return [dict(r["p"]) for r in records]

    async def get_papers_by_author(self, author_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Find all papers by a specific author."""
        query = """
        MATCH (p:Paper)-[:AUTHORED_BY]->(a:Author)
        WHERE toLower(a.name) CONTAINS toLower($author_name)
        RETURN p
        ORDER BY p.year DESC
        LIMIT $limit
        """
        async with self.driver.session() as session:
            result = await session.run(
                cast("LiteralString", query),
                author_name=author_name,
                limit=limit
            )
            records = await result.data()
            return [dict(r["p"]) for r in records]

    async def get_author_network(self, author_name: str, depth: int = 2) -> Dict[str, Any]:
        """Find collaboration network around an author."""
        query = """
        MATCH path = (a:Author {name: $author_name})-[:AUTHORED_BY|COLLABORATES_WITH*1..$depth]-(other)
        RETURN nodes(path) AS nodes, relationships(path) AS rels
        LIMIT 100
        """
        async with self.driver.session() as session:
            result = await session.run(
                cast("LiteralString", query),
                author_name=author_name,
                depth=depth
            )
            records = await result.data()
            return {"paths": records, "author": author_name}

    async def get_citation_network(self, paper_id: str, depth: int = 2) -> Dict[str, Any]:
        """Get citation chain for a paper."""
        query = """
        MATCH path = (p:Paper {paper_id: $paper_id})-[:CITES*1..$depth]->(cited:Paper)
        RETURN cited.paper_id AS id, cited.title AS title, cited.year AS year,
               cited.citation_count AS citations
        ORDER BY cited.citation_count DESC
        LIMIT 50
        """
        async with self.driver.session() as session:
            result = await session.run(
                cast("LiteralString", query),
                paper_id=paper_id,
                depth=depth
            )
            records = await result.data()
            return {"root_paper": paper_id, "cited_papers": records}

    async def get_top_concepts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get the most connected concept nodes."""
        query = """
        MATCH (c:Concept)<-[:COVERS]-(p:Paper)
        RETURN c.name AS concept, count(p) AS paper_count
        ORDER BY paper_count DESC
        LIMIT $limit
        """
        async with self.driver.session() as session:
            result = await session.run(cast("LiteralString", query), limit=limit)
            return await result.data()

    async def get_related_concepts(self, concept: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Find concepts related to a given concept through shared papers."""
        query = """
        MATCH (c:Concept {name: $concept})<-[:COVERS]-(p:Paper)-[:COVERS]->(related:Concept)
        WHERE related.name <> $concept
        RETURN related.name AS concept, count(p) AS shared_papers
        ORDER BY shared_papers DESC
        LIMIT $limit
        """
        async with self.driver.session() as session:
            result = await session.run(
                cast("LiteralString", query),
                concept=concept,
                limit=limit
            )
            return await result.data()

    async def get_prolific_authors(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get authors with the most papers."""
        query = """
        MATCH (p:Paper)-[:AUTHORED_BY]->(a:Author)
        RETURN a.name AS author, count(p) AS paper_count
        ORDER BY paper_count DESC
        LIMIT $limit
        """
        async with self.driver.session() as session:
            result = await session.run(cast("LiteralString", query), limit=limit)
            return await result.data()

    async def search_papers(self, keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Full-text search on paper title and abstract."""
        query = """
        MATCH (p:Paper)
        WHERE toLower(p.title) CONTAINS toLower($keyword)
           OR toLower(p.abstract) CONTAINS toLower($keyword)
        RETURN p
        ORDER BY p.citation_count DESC
        LIMIT $limit
        """
        async with self.driver.session() as session:
            result = await session.run(
                cast("LiteralString", query),
                keyword=keyword,
                limit=limit
            )
            records = await result.data()
            return [dict(r["p"]) for r in records]

    async def get_graph_stats(self) -> Dict[str, Any]:
        """Return counts of all node and relationship types."""
        async with self.driver.session() as session:
            counts = {}
            for label in ["Paper", "Author", "Concept", "Venue"]:
                query = f"MATCH (n:{label}) RETURN count(n) AS cnt"
                r = await session.run(cast("LiteralString", query))
                rec = await r.single()
                counts[label.lower() + "_count"] = rec["cnt"] if rec else 0

            for rel in ["AUTHORED_BY", "CITES", "COVERS", "PUBLISHED_IN", "RELATED_TO"]:
                query = f"MATCH ()-[r:{rel}]->() RETURN count(r) AS cnt"
                r = await session.run(cast("LiteralString", query))
                rec = await r.single()
                counts[rel.lower() + "_count"] = rec["cnt"] if rec else 0

        return counts

    async def clear_graph(self) -> bool:
        """Delete all nodes and relationships (use with caution)."""
        query = "MATCH (n) DETACH DELETE n"
        async with self.driver.session() as session:
            await session.run(cast("LiteralString", query))
        return True