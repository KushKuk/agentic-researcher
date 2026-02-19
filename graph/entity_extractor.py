"""
Entity extractor for pulling research entities from paper text.
Uses spaCy for NLP and Gemini for deeper concept extraction.
"""
from typing import List, Dict, Any, Optional
import spacy
from agents.llm_factory import create_llm
import json
import re


# Load spaCy model (download with: python -m spacy download en_core_web_sm)
_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            raise RuntimeError(
                "spaCy model not found. Run: python -m spacy download en_core_web_sm"
            )
    return _nlp


class EntityExtractor:
    """
    Extracts entities and concepts from academic paper text.

    Extraction layers:
    1. spaCy NLP – fast named entity recognition (ORGs, people, locations)
    2. Gemini LLM – deep concept and research-area extraction
    """

    CONCEPT_PROMPT = """You are an academic research analyst. Extract key research entities from the paper below.

Title: {title}
Abstract: {abstract}

Return ONLY a valid JSON object (no markdown, no commentary):
{{
    "concepts": ["list of core research concepts/topics"],
    "methods": ["research methods and techniques used"],
    "datasets": ["datasets or benchmarks mentioned"],
    "tasks": ["NLP/ML/AI tasks addressed"],
    "venues": ["journals or conferences mentioned, or empty list"]
}}

Rules:
- Keep each item concise (1–4 words)
- Maximum 8 items per category
- Use lowercase for concepts
"""

    def __init__(self):
        self.llm = create_llm(temperature=0.1)  # Low temp for precise extraction

    async def extract_from_paper(
        self,
        title: str,
        abstract: str,
        full_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extract all entities from a paper.

        Args:
            title: Paper title
            abstract: Paper abstract
            full_text: Optional full text for richer extraction

        Returns:
            Dictionary with extracted entities
        """
        # Layer 1: spaCy NER on title + abstract
        spacy_entities = self._extract_spacy_entities(f"{title}. {abstract}")

        # Layer 2: Gemini concept extraction
        llm_entities = await self._extract_llm_concepts(title, abstract)

        # Merge results
        return {
            "authors_mentioned":  spacy_entities.get("persons", []),
            "organizations":      spacy_entities.get("orgs", []),
            "concepts":           llm_entities.get("concepts", []),
            "methods":            llm_entities.get("methods", []),
            "datasets":           llm_entities.get("datasets", []),
            "tasks":              llm_entities.get("tasks", []),
            "venues":             llm_entities.get("venues", []),
        }

    def _extract_spacy_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Run spaCy NER on text and bucket results by label.

        Returns:
            Dict with 'persons' and 'orgs' lists
        """
        nlp = _get_nlp()
        doc = nlp(text[:5000])  # Limit for speed

        persons = list({
            ent.text.strip()
            for ent in doc.ents
            if ent.label_ == "PERSON" and len(ent.text.strip()) > 2
        })
        orgs = list({
            ent.text.strip()
            for ent in doc.ents
            if ent.label_ == "ORG" and len(ent.text.strip()) > 2
        })

        return {"persons": persons[:10], "orgs": orgs[:10]}

    async def _extract_llm_concepts(
        self, title: str, abstract: str
    ) -> Dict[str, List[str]]:
        """
        Use Gemini to extract structured research concepts.

        Returns:
            Dict with concepts, methods, datasets, tasks, venues
        """
        prompt = self.CONCEPT_PROMPT.format(
            title=title,
            abstract=abstract[:2000]
        )

        try:
            response = await self.llm.ainvoke(prompt)
            return self._parse_json_response(self._extract_text(response.content))
        except Exception:
            return {"concepts": [], "methods": [], "datasets": [], "tasks": [], "venues": []}

    def _extract_text(self, content: "str | list") -> str:
        """
        Normalise Gemini response content to a plain string.

        Args:
            content: Raw response.content from the LLM.

        Returns:
            A single concatenated string.
        """
        if isinstance(content, str):
            return content
        # List of blocks – extract text from each
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text", "")))
            else:
                parts.append(str(block))
        return "\n".join(parts)

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON from LLM response, stripping markdown fences."""
        # Strip ```json ... ``` fences
        clean = re.sub(r"```(?:json)?|```", "", text).strip()
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            # Attempt to find a JSON object in the text
            match = re.search(r"\{.*\}", clean, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except Exception:
                    pass
        return {"concepts": [], "methods": [], "datasets": [], "tasks": [], "venues": []}

    def extract_keywords_simple(self, text: str, top_n: int = 10) -> List[str]:
        """
        Fast keyword extraction using spaCy noun chunks.

        Args:
            text: Input text
            top_n: Maximum keywords to return

        Returns:
            List of keyword strings
        """
        nlp = _get_nlp()
        doc = nlp(text[:3000])

        # Collect noun chunks and filter stopwords
        chunks = [
            chunk.text.lower().strip()
            for chunk in doc.noun_chunks
            if len(chunk.text.split()) <= 4
            and not all(t.is_stop for t in chunk)
        ]

        # Deduplicate while preserving order
        seen: set = set()
        keywords: List[str] = []
        for chunk in chunks:
            if chunk not in seen:
                seen.add(chunk)
                keywords.append(chunk)
            if len(keywords) >= top_n:
                break

        return keywords