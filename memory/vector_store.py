"""
Vector memory store using FAISS for semantic search.
Stores and retrieves paper embeddings with metadata.
"""
import faiss
import numpy as np
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import asyncio
from datetime import datetime


class VectorMemoryStore:
    """
    FAISS-based vector store for paper embeddings and semantic search.
    
    Features:
    - Store paper embeddings
    - Semantic similarity search
    - Metadata management
    - Persistence to disk
    - Incremental updates
    """
    
    def __init__(
        self,
        embedding_model: str = "all-MiniLM-L6-v2",
        index_path: str = "./data/vector_db/faiss_index",
        metadata_path: str = "./data/vector_db/metadata.json",
        dimension: int = 384  # all-MiniLM-L6-v2 dimension
    ):
        """
        Initialize vector memory store.
        
        Args:
            embedding_model: Sentence transformer model name
            index_path: Path to FAISS index file
            metadata_path: Path to metadata JSON file
            dimension: Embedding dimension
        """
        self.embedding_model_name = embedding_model
        self.index_path = Path(index_path)
        self.metadata_path = Path(metadata_path)
        self.dimension = dimension
        
        # Create directories
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize embedding model
        self.model = SentenceTransformer(embedding_model)
        
        # Initialize or load FAISS index
        self.index = self._initialize_index()
        
        # Load or initialize metadata
        self.metadata = self._load_metadata()
        
        # Track number of vectors
        self.next_id = len(self.metadata)
    
    def _initialize_index(self) -> faiss.Index:
        """
        Initialize or load FAISS index.
        
        Returns:
            FAISS index
        """
        if self.index_path.exists():
            return faiss.read_index(str(self.index_path))
        else:
            # Create new index with inner product similarity
            return faiss.IndexFlatIP(self.dimension)
    
    def _load_metadata(self) -> Dict[int, Dict[str, Any]]:
        """
        Load metadata from disk.
        
        Returns:
            Dictionary mapping vector IDs to metadata
        """
        if self.metadata_path.exists():
            with open(self.metadata_path, 'r') as f:
                return {int(k): v for k, v in json.load(f).items()}
        return {}
    
    def _save_metadata(self):
        """Save metadata to disk."""
        with open(self.metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
    def _save_index(self):
        """Save FAISS index to disk."""
        faiss.write_index(self.index, str(self.index_path))
    
    async def add_paper(
        self,
        paper_id: str,
        title: str,
        abstract: str,
        authors: List[str],
        year: Optional[int] = None,
        summary: Optional[Dict[str, Any]] = None,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Add a paper to the vector store.
        
        Args:
            paper_id: Unique paper identifier
            title: Paper title
            abstract: Paper abstract
            authors: List of author names
            year: Publication year
            summary: Optional structured summary
            additional_metadata: Optional additional metadata
            
        Returns:
            Vector ID assigned to this paper
        """
        # Create text for embedding (title + abstract)
        text = f"{title}\n\n{abstract}"
        
        # Generate embedding
        embedding = await self._generate_embedding(text)
        
        # Normalize for cosine similarity
        embedding = embedding / np.linalg.norm(embedding)
        
        # Add to FAISS index
        self.index.add(np.array([embedding], dtype=np.float32))
        
        # Store metadata
        vector_id = self.next_id
        self.metadata[vector_id] = {
            "paper_id": paper_id,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "year": year,
            "summary": summary,
            "added_at": datetime.now().isoformat(),
            **(additional_metadata or {})
        }
        
        self.next_id += 1
        
        # Save to disk
        self._save_index()
        self._save_metadata()
        
        return vector_id
    
    async def add_papers_batch(
        self,
        papers: List[Dict[str, Any]]
    ) -> List[int]:
        """
        Add multiple papers in batch.
        
        Args:
            papers: List of paper dictionaries with required fields
            
        Returns:
            List of vector IDs assigned
        """
        vector_ids = []
        
        for paper in papers:
            vector_id = await self.add_paper(
                paper_id=paper.get("paper_id", ""),
                title=paper.get("title", ""),
                abstract=paper.get("abstract", ""),
                authors=paper.get("authors", []),
                year=paper.get("year"),
                summary=paper.get("summary"),
                additional_metadata=paper.get("metadata")
            )
            vector_ids.append(vector_id)
        
        return vector_ids
    
    async def search_similar(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.0
    ) -> List[Tuple[int, float, Dict[str, Any]]]:
        """
        Search for similar papers using semantic search.
        
        Args:
            query: Search query text
            top_k: Number of results to return
            min_similarity: Minimum similarity threshold (0-1)
            
        Returns:
            List of (vector_id, similarity_score, metadata) tuples
        """
        if self.index.ntotal == 0:
            return []
        
        # Generate query embedding
        query_embedding = await self._generate_embedding(query)
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        
        # Search FAISS index
        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(np.array([query_embedding], dtype=np.float32),k)
        
        # Format results
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if score >= min_similarity:
                vector_id = int(idx)
                metadata = self.metadata.get(vector_id, {})
                results.append((vector_id, float(score), metadata))
        
        return results
    
    async def search_by_paper_id(
        self,
        paper_id: str,
        top_k: int = 5
    ) -> List[Tuple[int, float, Dict[str, Any]]]:
        """
        Find papers similar to a given paper ID.
        
        Args:
            paper_id: Paper ID to find similar papers for
            top_k: Number of results
            
        Returns:
            List of similar papers
        """
        # Find the paper's metadata
        for vector_id, meta in self.metadata.items():
            if meta.get("paper_id") == paper_id:
                # Get its embedding and search
                text = f"{meta['title']}\n\n{meta['abstract']}"
                return await self.search_similar(text, top_k + 1)
        
        return []
    
    async def _generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for text.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector
        """
        # Run in thread pool since sentence-transformers is CPU-bound
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(
            None,
            self.model.encode,
            text
        )
        return embedding
    
    def get_metadata(self, vector_id: int) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a vector ID.
        
        Args:
            vector_id: Vector ID
            
        Returns:
            Metadata dictionary or None
        """
        return self.metadata.get(vector_id)
    
    def get_all_metadata(self) -> Dict[int, Dict[str, Any]]:
        """
        Get all metadata.
        
        Returns:
            Complete metadata dictionary
        """
        return self.metadata.copy()
    
    def delete_paper(self, vector_id: int) -> bool:
        """
        Delete a paper from metadata (FAISS doesn't support deletion).
        
        Args:
            vector_id: Vector ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        if vector_id in self.metadata:
            del self.metadata[vector_id]
            self._save_metadata()
            return True
        return False
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the vector store.
        
        Returns:
            Statistics dictionary
        """
        return {
            "total_papers": self.index.ntotal,
            "dimension": self.dimension,
            "embedding_model": self.embedding_model_name,
            "metadata_entries": len(self.metadata),
            "index_path": str(self.index_path),
            "metadata_path": str(self.metadata_path)
        }
    
    def clear(self):
        """Clear all data from the vector store."""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = {}
        self.next_id = 0
        self._save_index()
        self._save_metadata()