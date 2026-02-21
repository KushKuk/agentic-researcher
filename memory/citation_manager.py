"""
Citation manager for retrieval-backed claim verification.
Attributes claims in summaries to source papers using semantic similarity.
"""
from typing import List, Dict, Any, Optional
import re
from memory.vector_store import VectorMemoryStore


class CitationManager:
    """
    Manages citation attribution for generated summaries.
    
    Process:
    1. Split summary into sentences/claims
    2. Embed each sentence
    3. Retrieve most similar paper from vector DB
    4. Attach paper citation to each claim
    """
    
    def __init__(self, vector_store: VectorMemoryStore):
        """
        Initialize citation manager.
        
        Args:
            vector_store: Vector memory store containing paper embeddings
        """
        self.vector_store = vector_store
    
    async def add_citations(
        self,
        summary: str,
        min_similarity: float = 0.5,
        citation_format: str = "inline"
    ) -> Dict[str, Any]:
        """
        Add citations to a summary text.
        
        Args:
            summary: Generated summary text
            min_similarity: Minimum similarity threshold for citation
            citation_format: "inline" or "numbered"
            
        Returns:
            Dict with cited_text, citations list, and metadata
        """
        # Split into sentences
        sentences = self._split_into_sentences(summary)
        
        if not sentences:
            return {
                "cited_text": summary,
                "citations": [],
                "total_claims": 0,
                "cited_claims": 0
            }
        
        # Process each sentence
        cited_sentences = []
        citations = []
        citation_counter = 1
        
        for sentence in sentences:
            # Skip very short sentences (likely fragments)
            if len(sentence.strip()) < 10:
                cited_sentences.append(sentence)
                continue
            
            # Find source paper for this claim
            source = await self._find_source(sentence, min_similarity)
            
            if source:
                # Add citation
                if citation_format == "inline":
                    cited_sentence = f"{sentence} [{source['title'][:50]}...]"
                else:  # numbered
                    cited_sentence = f"{sentence}[{citation_counter}]"
                    citation_counter += 1
                
                cited_sentences.append(cited_sentence)
                citations.append({
                    "claim": sentence.strip(),
                    "paper_id": source["paper_id"],
                    "title": source["title"],
                    "authors": source.get("authors", []),
                    "similarity": source["similarity"],
                    "citation_number": citation_counter - 1 if citation_format == "numbered" else None
                })
            else:
                # No confident source found
                cited_sentences.append(sentence)
        
        cited_text = " ".join(cited_sentences)
        
        return {
            "cited_text": cited_text,
            "citations": citations,
            "total_claims": len(sentences),
            "cited_claims": len(citations),
            "citation_coverage": len(citations) / len(sentences) if sentences else 0
        }
    
    async def verify_summary(
        self,
        summary: str,
        source_papers: List[Dict[str, Any]],
        min_similarity: float = 0.6
    ) -> Dict[str, Any]:
        """
        Verify that summary claims are backed by source papers.
        
        Args:
            summary: Generated summary to verify
            source_papers: List of source papers that should support the summary
            min_similarity: Threshold for verification
            
        Returns:
            Verification report with supported/unsupported claims
        """
        sentences = self._split_into_sentences(summary)
        
        supported_claims = []
        unsupported_claims = []
        
        for sentence in sentences:
            if len(sentence.strip()) < 10:
                continue
            
            source = await self._find_source(sentence, min_similarity)
            
            # Check if source is in the provided source_papers
            is_supported = False
            if source:
                for paper in source_papers:
                    if paper.get("paper_id") == source["paper_id"]:
                        is_supported = True
                        break
            
            if is_supported:
                supported_claims.append({
                    "claim": sentence.strip(),
                    "source": source
                })
            else:
                unsupported_claims.append({
                    "claim": sentence.strip(),
                    "source": source if source else None
                })
        
        return {
            "total_claims": len(sentences),
            "supported_claims": len(supported_claims),
            "unsupported_claims": len(unsupported_claims),
            "verification_rate": len(supported_claims) / len(sentences) if sentences else 0,
            "supported": supported_claims,
            "unsupported": unsupported_claims
        }
    
    async def generate_bibliography(
        self,
        citations: List[Dict[str, Any]],
        format: str = "apa"
    ) -> str:
        """
        Generate a formatted bibliography from citations.
        
        Args:
            citations: List of citation dicts
            format: Citation format ("apa", "mla", "chicago")
            
        Returns:
            Formatted bibliography string
        """
        # Deduplicate by paper_id
        unique_papers = {}
        for citation in citations:
            paper_id = citation["paper_id"]
            if paper_id not in unique_papers:
                unique_papers[paper_id] = citation
        
        # Format each citation
        bibliography_entries = []
        for i, (paper_id, citation) in enumerate(unique_papers.items(), 1):
            if format == "apa":
                entry = self._format_apa(citation, i)
            elif format == "mla":
                entry = self._format_mla(citation, i)
            else:  # chicago
                entry = self._format_chicago(citation, i)
            
            bibliography_entries.append(entry)
        
        return "\n\n".join(bibliography_entries)
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences.
        
        Args:
            text: Input text
            
        Returns:
            List of sentences
        """
        # Simple sentence splitter - handles common cases
        # Split on . ! ? followed by space and capital letter
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        return [s.strip() for s in sentences if s.strip()]
    
    async def _find_source(
        self,
        claim: str,
        min_similarity: float
    ) -> Optional[Dict[str, Any]]:
        """
        Find the most similar paper for a given claim.
        
        Args:
            claim: Claim/sentence to find source for
            min_similarity: Minimum similarity threshold
            
        Returns:
            Source paper dict or None
        """
        # Search vector store
        results = await self.vector_store.search_similar(
            query=claim,
            top_k=1,
            min_similarity=min_similarity
        )
        
        if not results:
            return None
        
        # Return the best match
        vector_id, similarity, metadata = results[0]
        
        return {
            "paper_id": metadata.get("paper_id", ""),
            "title": metadata.get("title", ""),
            "authors": metadata.get("authors", []),
            "year": metadata.get("year"),
            "similarity": similarity,
            "vector_id": vector_id
        }
    
    def _format_apa(self, citation: Dict[str, Any], number: int) -> str:
        """Format citation in APA style."""
        authors = citation.get("authors", [])
        author_str = ", ".join(authors[:3])  # First 3 authors
        if len(authors) > 3:
            author_str += ", et al."
        
        year = citation.get("year", "n.d.")
        title = citation["title"]
        
        return f"[{number}] {author_str} ({year}). {title}."
    
    def _format_mla(self, citation: Dict[str, Any], number: int) -> str:
        """Format citation in MLA style."""
        authors = citation.get("authors", [])
        if authors:
            author_str = f"{authors[0]}, et al." if len(authors) > 1 else authors[0]
        else:
            author_str = "Unknown"
        
        title = citation["title"]
        
        return f"[{number}] {author_str} \"{title}.\""
    
    def _format_chicago(self, citation: Dict[str, Any], number: int) -> str:
        """Format citation in Chicago style."""
        authors = citation.get("authors", [])
        author_str = ", ".join(authors[:2])
        if len(authors) > 2:
            author_str += ", et al."
        
        year = citation.get("year", "n.d.")
        title = citation["title"]
        
        return f"[{number}] {author_str}. {title}. {year}."