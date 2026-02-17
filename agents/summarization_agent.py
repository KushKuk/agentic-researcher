"""
Summarization agent for extracting key information from academic papers.
Uses LLM to generate structured summaries from paper text.
"""
from typing import Dict, Any, Optional
from langchain.prompts import ChatPromptTemplate
from agents.base_agent import BaseAgent, AgentState
from llm_factory import create_llm


class SummarizationAgent(BaseAgent):
    """
    Agent that summarizes academic papers and extracts key information.
    """
    
    SUMMARIZATION_PROMPT = """You are an expert academic paper summarizer. Your job is to extract and summarize key information from research papers.

Paper Title: {title}
Paper Text (truncated if long):
{text}

Extract the following information in a structured format:

1. **Main Research Question/Problem**: What problem is the paper addressing?
2. **Methodology**: What methods/approaches did the authors use?
3. **Key Findings**: What are the main results and discoveries?
4. **Contributions**: What are the novel contributions to the field?
5. **Limitations**: What limitations or future work are mentioned?
6. **Key Takeaways**: 3-5 bullet points summarizing the paper

Provide your response in JSON format:
{{
    "research_question": "...",
    "methodology": "...",
    "key_findings": "...",
    "contributions": "...",
    "limitations": "...",
    "takeaways": ["...", "...", "..."],
    "summary": "A 2-3 sentence overall summary"
}}
"""
    
    ABSTRACT_EXTRACTION_PROMPT = """You are extracting the abstract section from a research paper.

Paper text:
{text}

Find and extract ONLY the abstract section. The abstract is typically:
- Near the beginning of the paper
- A single paragraph or a few paragraphs
- Summarizes the entire paper
- Usually labeled as "Abstract" or appears after the title/authors

Return ONLY the abstract text, nothing else. If you cannot find a clear abstract, return "ABSTRACT_NOT_FOUND".
"""
    
    def __init__(
        self,
        model: Optional[str] = None,
        temperature: float = 0.3  # Lower temperature for more focused summaries
    ):
        """
        Initialize summarization agent.
        
        Args:
            model: LLM model name
            temperature: LLM temperature
        """
        super().__init__(
            name="summarization_agent",
            description="Extracts key information and generates summaries from academic papers"
        )
        
        self.llm = create_llm(
            model=model,
            temperature=temperature
        )
        
        self.summary_prompt = ChatPromptTemplate.from_template(self.SUMMARIZATION_PROMPT)
        self.abstract_prompt = ChatPromptTemplate.from_template(self.ABSTRACT_EXTRACTION_PROMPT)
    
    async def process(self, state: AgentState) -> AgentState:
        """
        Process paper text and generate summary.
        
        Args:
            state: Current agent state with paper text
            
        Returns:
            Updated state with summary
        """
        # Get paper data from state
        paper_data = state.metadata.get("paper_data", {})
        paper_text = paper_data.get("text", "")
        paper_title = paper_data.get("title", "Unknown Title")
        
        if not paper_text:
            state.error = "No paper text provided for summarization"
            return state
        
        try:
            # Truncate text if too long (to fit in context window)
            max_chars = 12000  # Roughly 3000 tokens
            truncated_text = paper_text[:max_chars]
            if len(paper_text) > max_chars:
                truncated_text += "\n\n[Text truncated due to length...]"
            
            # Generate summary
            prompt = self.summary_prompt.format(
                title=paper_title,
                text=truncated_text
            )
            
            response = await self.llm.ainvoke(prompt)
            summary_data = self._parse_summary(response.content)
            
            # Store in state
            state.final_output = {
                "title": paper_title,
                "summary": summary_data,
                "metadata": {
                    "text_length": len(paper_text),
                    "truncated": len(paper_text) > max_chars
                }
            }
            
        except Exception as e:
            state.error = f"Error generating summary: {str(e)}"
        
        return state
    
    async def extract_abstract(self, paper_text: str) -> Dict[str, Any]:
        """
        Extract just the abstract from paper text.
        
        Args:
            paper_text: Full paper text
            
        Returns:
            Dictionary with abstract or error
        """
        try:
            # Use first 5000 chars (abstract is usually at the beginning)
            text_snippet = paper_text[:5000]
            
            prompt = self.abstract_prompt.format(text=text_snippet)
            response = await self.llm.ainvoke(prompt)
            
            abstract = response.content.strip()
            
            if "ABSTRACT_NOT_FOUND" in abstract:
                return {"success": False, "abstract": None, "error": "Abstract not found"}
            
            return {"success": True, "abstract": abstract, "error": None}
            
        except Exception as e:
            return {"success": False, "abstract": None, "error": str(e)}
    
    async def summarize_with_abstract(
        self,
        title: str,
        abstract: str,
        full_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate summary using abstract (and optionally full text).
        
        Args:
            title: Paper title
            abstract: Paper abstract
            full_text: Optional full paper text
            
        Returns:
            Structured summary dictionary
        """
        try:
            # If we have full text, use it along with abstract
            if full_text:
                text = f"ABSTRACT:\n{abstract}\n\nFULL TEXT:\n{full_text[:8000]}"
            else:
                text = abstract
            
            prompt = self.summary_prompt.format(title=title, text=text)
            response = await self.llm.ainvoke(prompt)
            
            return self._parse_summary(response.content)
            
        except Exception as e:
            return {"error": str(e)}
    
    def _parse_summary(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured summary.
        
        Args:
            response: LLM response text
            
        Returns:
            Structured summary dictionary
        """
        import json
        import re
        
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass
        
        # Fallback: return raw response
        return {
            "research_question": "Could not parse",
            "methodology": "Could not parse",
            "key_findings": "Could not parse",
            "contributions": "Could not parse",
            "limitations": "Could not parse",
            "takeaways": [],
            "summary": response[:500],
            "raw_response": response
        }