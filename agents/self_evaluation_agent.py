"""
Self-evaluation agent for research quality assessment.
Evaluates research outputs, identifies gaps, and suggests improvements.
"""
from typing import Dict, Any, List, Optional
from agents.base_agent import BaseAgent, AgentState
from agents.llm_factory import create_llm

class SelfEvaluationAgent(BaseAgent):
    """
    Agent that evaluates research quality and completeness.
    
    Capabilities:
    - Assess research coverage and depth
    - Identify knowledge gaps
    - Evaluate source quality
    - Suggest improvements
    - Generate quality scores
    """
    
    EVALUATION_PROMPT = """You are a research quality evaluator. Assess the research output critically.

**Research Task:**
{task}

**Research Output:**
{output}

**Source Papers:**
{sources}

**Evaluation Criteria:**
1. **Completeness** - Does the research fully address the task?
2. **Accuracy** - Are claims supported by sources?
3. **Coverage** - Are all relevant aspects covered?
4. **Source Quality** - Are sources authoritative and recent?
5. **Depth** - Is the analysis sufficiently detailed?

**Output Format (JSON):**
{{
    "overall_score": 1-10,
    "completeness_score": 1-10,
    "accuracy_score": 1-10,
    "coverage_score": 1-10,
    "source_quality_score": 1-10,
    "depth_score": 1-10,
    "strengths": ["list of strengths"],
    "weaknesses": ["list of weaknesses"],
    "gaps": ["identified knowledge gaps"],
    "improvement_suggestions": ["specific suggestions"],
    "additional_queries": ["suggested follow-up searches"]
}}
"""
    
    GAP_ANALYSIS_PROMPT = """Analyze knowledge gaps in the research.

**Research Task:** {task}
**Current Output:** {output}
**Sources Used:** {sources}

Identify specific gaps:
1. Missing subtopics or aspects
2. Underexplored areas
3. Contradictions or uncertainties
4. Need for more recent sources
5. Missing perspectives or approaches

**Output Format (JSON):**
{{
    "critical_gaps": ["high-priority missing information"],
    "minor_gaps": ["nice-to-have additional information"],
    "suggested_searches": ["specific search queries to fill gaps"],
    "priority_order": ["ordered list of gaps by importance"]
}}
"""
    
    IMPROVEMENT_PROMPT = """Generate specific improvement plan.

**Current Research:**
Task: {task}
Output: {output}
Quality Score: {score}/10

**Identified Issues:**
{issues}

Create an actionable improvement plan:

**Output Format (JSON):**
{{
    "improvement_steps": [
        {{
            "step": 1,
            "action": "specific action",
            "rationale": "why this helps",
            "expected_impact": "what will improve"
        }}
    ],
    "revised_query_strategy": "how to search better",
    "target_score": "realistic target score after improvements"
}}
"""
    
    def __init__(
        self,
        model: Optional[str] = None,
        temperature: float = 0.3  # Lower for consistent evaluation
    ):
        """
        Initialize self-evaluation agent.
        
        Args:
            model: LLM model name
            temperature: LLM temperature
        """
        super().__init__(
            name="self_evaluation_agent",
            description="Evaluates research quality and suggests improvements"
        )
        
        self.llm = create_llm(model=model, temperature=temperature)
    
    async def process(self, state: AgentState) -> AgentState:
        """
        Evaluate research output and update state with assessment.
        
        Args:
            state: Agent state with research output
            
        Returns:
            Updated state with evaluation
        """
        # Extract research data
        task = state.metadata.get("task", "")
        output = state.final_output or state.metadata.get("output", "")
        sources = state.metadata.get("sources", [])
        
        if not output:
            state.error = "No output to evaluate"
            return state
        
        try:
            # Run evaluation
            evaluation = await self.evaluate_research(task, output, sources)
            
            # Store in state
            state.metadata["evaluation"] = evaluation
            state.final_output = evaluation
            
        except Exception as e:
            state.error = f"Evaluation error: {str(e)}"
        
        return state
    
    async def evaluate_research(
        self,
        task: str,
        output: Any,
        sources: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Comprehensive research evaluation.
        
        Args:
            task: Original research task
            output: Research output to evaluate
            sources: Source papers used
            
        Returns:
            Evaluation report with scores and suggestions
        """
        # Format output as string
        output_text = self._format_output(output)
        sources_text = self._format_sources(sources)
        
        # Generate evaluation
        prompt = self.EVALUATION_PROMPT.format(
            task=task,
            output=output_text,
            sources=sources_text
        )
        
        response = await self.llm.ainvoke(prompt)
        evaluation = self._parse_json(self._extract_text(response.content))
        
        return evaluation
    
    async def identify_gaps(
        self,
        task: str,
        output: Any,
        sources: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Identify knowledge gaps in research.
        
        Args:
            task: Research task
            output: Current research output
            sources: Sources used
            
        Returns:
            Gap analysis with suggestions
        """
        output_text = self._format_output(output)
        sources_text = self._format_sources(sources)
        
        prompt = self.GAP_ANALYSIS_PROMPT.format(
            task=task,
            output=output_text,
            sources=sources_text
        )
        
        response = await self.llm.ainvoke(prompt)
        gaps = self._parse_json(self._extract_text(response.content))
        
        return gaps
    
    async def generate_improvement_plan(
        self,
        task: str,
        output: Any,
        evaluation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate actionable improvement plan.
        
        Args:
            task: Research task
            output: Current output
            evaluation: Evaluation results
            
        Returns:
            Improvement plan with specific steps
        """
        output_text = self._format_output(output)
        
        # Format issues from evaluation
        issues = []
        if evaluation.get("weaknesses"):
            issues.extend(evaluation["weaknesses"])
        if evaluation.get("gaps"):
            issues.extend(evaluation["gaps"])
        issues_text = "\n".join(f"- {issue}" for issue in issues)
        
        prompt = self.IMPROVEMENT_PROMPT.format(
            task=task,
            output=output_text,
            score=evaluation.get("overall_score", 0),
            issues=issues_text
        )
        
        response = await self.llm.ainvoke(prompt)
        plan = self._parse_json(self._extract_text(response.content))
        
        return plan
    
    async def iterative_evaluation(
        self,
        task: str,
        output: Any,
        sources: List[Dict[str, Any]],
        threshold_score: float = 8.0
    ) -> Dict[str, Any]:
        """
        Complete iterative evaluation cycle.
        
        Args:
            task: Research task
            output: Research output
            sources: Sources used
            threshold_score: Minimum acceptable score
            
        Returns:
            Full evaluation with improvement recommendations
        """
        # Step 1: Evaluate
        evaluation = await self.evaluate_research(task, output, sources)
        
        overall_score = evaluation.get("overall_score", 0)
        
        # Step 2: Identify gaps
        gaps = await self.identify_gaps(task, output, sources)
        
        # Step 3: Generate improvement plan (if needed)
        improvement_plan = None
        needs_improvement = overall_score < threshold_score
        
        if needs_improvement:
            improvement_plan = await self.generate_improvement_plan(
                task, output, evaluation
            )
        
        return {
            "evaluation": evaluation,
            "gaps": gaps,
            "needs_improvement": needs_improvement,
            "improvement_plan": improvement_plan,
            "passed_threshold": overall_score >= threshold_score
        }
    
    def _extract_text(self, content: "str | list") -> str:
        """Normalise Gemini response to plain string."""
        if isinstance(content, str):
            return content
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text", "")))
            else:
                parts.append(str(block))
        return "\n".join(parts)
    
    def _format_output(self, output: Any) -> str:
        """Format output for evaluation."""
        if isinstance(output, str):
            return output
        elif isinstance(output, dict):
            # Extract text from common keys
            if "summary" in output:
                return str(output["summary"])
            elif "content" in output:
                return str(output["content"])
            return str(output)
        return str(output)
    
    def _format_sources(self, sources: List[Dict[str, Any]]) -> str:
        """Format sources for prompt."""
        if not sources:
            return "No sources provided"
        
        formatted = []
        for i, source in enumerate(sources[:10], 1):  # Top 10
            title = source.get("title", "Unknown")
            year = source.get("year", "N/A")
            citations = source.get("citation_count", 0)
            formatted.append(f"{i}. {title} ({year}) - {citations} citations")
        
        return "\n".join(formatted)
    
    def _parse_json(self, response: str) -> Dict[str, Any]:
        """Parse JSON from LLM response."""
        import json
        import re
        
        # Strip markdown fences
        clean = re.sub(r"```(?:json)?|```", "", response).strip()
        
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            pass
        
        try:
            match = re.search(r"\{.*\}", clean, re.DOTALL)
            if match:
                return json.loads(match.group())
        except json.JSONDecodeError:
            pass
        
        return {
            "overall_score": 5,
            "error": "Could not parse evaluation response"
        }