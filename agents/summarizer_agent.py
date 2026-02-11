from typing import Dict
from openai import OpenAI

client = OpenAI()

class SummarizerAgent:

    def summarize(self, paper: Dict):

        if not paper or not paper.get("abstract"):
            return None

        prompt = f"""
You are a research analyst AI.

Analyze this academic paper and return structured JSON with:
- summary
- contributions
- methodology
- limitations
- research_area

Title: {paper["title"]}
Year: {paper["year"]}
Authors: {", ".join(paper["authors"])}

Abstract:
{paper["abstract"]}
"""

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )

        content = response.choices[0].message.content

        return {
            "title": paper["title"],
            "year": paper["year"],
            "authors": paper["authors"],
            "analysis": content
        }
