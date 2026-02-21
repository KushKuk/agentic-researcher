"""
Iterative research pipeline with self-evaluation and improvement.
Phase 7: Self-improving research agent.
"""
from typing import Dict, Any, Optional, List
import time
from pipelines.memory_enhanced_pipeline import MemoryEnhancedPipeline
from agents.self_evaluation_agent import SelfEvaluationAgent
from tools.semantic_scholar_tool import SemanticScholarTool
from config.settings import settings


class IterativeResearchPipeline:
    """
    Self-improving research pipeline with evaluation loops.
    
    Workflow:
    1. Initial research
    2. Self-evaluate output
    3. Identify gaps
    4. Run additional searches to fill gaps
    5. Repeat until quality threshold met
    """
    
    def __init__(
        self,
        max_iterations: int = 3,
        quality_threshold: float = 8.0,
        enable_memory: bool = True
    ):
        """
        Initialize iterative research pipeline.
        
        Args:
            max_iterations: Maximum improvement iterations
            quality_threshold: Minimum quality score (1-10)
            enable_memory: Enable memory features
        """
        self.max_iterations = max_iterations
        self.quality_threshold = quality_threshold
        self.enable_memory = enable_memory
        
        # Initialize components
        self.base_pipeline = MemoryEnhancedPipeline(enable_memory=enable_memory)
        self.evaluator = SelfEvaluationAgent()
        self.semantic_scholar = SemanticScholarTool(
            api_key=settings.semantic_scholar_api_key
        )
    
    async def run_with_self_improvement(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute research with iterative self-improvement.
        
        Args:
            task: Research task
            context: Optional context
            
        Returns:
            Final research output with evaluation history
        """
        start_time = time.time()
        iterations = []
        current_output = None
        all_sources = []
        
        for iteration in range(self.max_iterations):
            iteration_start = time.time()
            
            # Step 1: Research (initial or follow-up)
            if iteration == 0:
                # Initial research
                result = await self.base_pipeline.run(task=task, context=context)
                current_output = result.get("final_output")
                
                # Extract sources from messages
                sources = self._extract_sources(result.get("messages", []))
                all_sources.extend(sources)
            else:
                # Follow-up research based on gaps
                previous_eval = iterations[-1]["evaluation"]
                gaps = previous_eval.get("gaps", {})
                suggested_queries = gaps.get("suggested_searches", [])
                
                if not suggested_queries:
                    break  # No more improvement possible
                
                # Run additional searches
                new_sources = await self._run_gap_filling_searches(suggested_queries)
                all_sources.extend(new_sources)
                
                # Synthesize with new information
                current_output = await self._synthesize_research(
                    task, current_output, new_sources
                )
            
            # Step 2: Evaluate current output
            evaluation = await self.evaluator.iterative_evaluation(
                task=task,
                output=current_output,
                sources=all_sources,
                threshold_score=self.quality_threshold
            )
            
            iteration_time = time.time() - iteration_start
            
            # Record iteration
            iterations.append({
                "iteration": iteration + 1,
                "output": current_output,
                "evaluation": evaluation,
                "sources_count": len(all_sources),
                "time_seconds": iteration_time
            })
            
            # Check if threshold met
            overall_score = evaluation.get("evaluation", {}).get("overall_score", 0)
            if overall_score >= self.quality_threshold:
                break
        
        total_time = time.time() - start_time
        final_eval = iterations[-1]["evaluation"] if iterations else {}
        
        return {
            "success": True,
            "task": task,
            "final_output": current_output,
            "iterations": iterations,
            "total_iterations": len(iterations),
            "final_score": final_eval.get("evaluation", {}).get("overall_score", 0),
            "threshold_met": final_eval.get("passed_threshold", False),
            "total_sources": len(all_sources),
            "execution_time_seconds": total_time
        }
    
    async def evaluate_existing_research(
        self,
        task: str,
        output: Any,
        sources: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate existing research output.
        
        Args:
            task: Original research task
            output: Research output to evaluate
            sources: Optional list of sources used
            
        Returns:
            Evaluation report
        """
        evaluation = await self.evaluator.iterative_evaluation(
            task=task,
            output=output,
            sources=sources or [],
            threshold_score=self.quality_threshold
        )
        
        return {
            "success": True,
            "task": task,
            "evaluation": evaluation,
            "recommendations": evaluation.get("improvement_plan")
        }
    
    async def _run_gap_filling_searches(
        self,
        queries: List[str],
        papers_per_query: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Run searches to fill identified gaps.
        
        Args:
            queries: List of search queries
            papers_per_query: Papers to retrieve per query
            
        Returns:
            List of additional papers
        """
        new_sources = []
        
        for query in queries[:3]:  # Limit to top 3 queries
            try:
                result = await self.semantic_scholar.execute(
                    query=query,
                    limit=papers_per_query
                )
                
                if result.success:
                    new_sources.extend(result.data)
            except Exception:
                continue
        
        return new_sources
    
    async def _synthesize_research(
        self,
        task: str,
        current_output: Any,
        new_sources: List[Dict[str, Any]]
    ) -> str:
        """
        Synthesize research with new information.
        
        Args:
            task: Research task
            current_output: Current research output
            new_sources: New sources to integrate
            
        Returns:
            Updated research output
        """
        # Use LLM to synthesize
        from agents.llm_factory import create_llm
        llm = create_llm(temperature=0.5)
        
        synthesis_prompt = f"""Synthesize and improve this research output with new information.

**Task:** {task}

**Current Output:**
{self._format_output(current_output)}

**New Sources:**
{self._format_sources(new_sources)}

**Instructions:**
- Integrate new information naturally
- Update or correct previous information if needed
- Maintain coherent structure
- Add depth where gaps were identified
- Keep it concise but comprehensive

**Output the improved research:**
"""
        
        response = await llm.ainvoke(synthesis_prompt)
        
        # Extract text from response
        if isinstance(response.content, str):
            return response.content
        elif isinstance(response.content, list):
            parts = []
            for block in response.content:
                if isinstance(block, dict):
                    parts.append(str(block.get("text", "")))
                elif isinstance(block, str):
                    parts.append(block)
            return "\n".join(parts)
        
        return str(response.content)
    
    def _extract_sources(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract source papers from research messages."""
        sources = []
        
        for msg in messages:
            result = msg.get("result", {})
            if isinstance(result, dict) and result.get("success"):
                data = result.get("data", [])
                if isinstance(data, list):
                    sources.extend(data)
        
        return sources
    
    def _format_output(self, output: Any) -> str:
        """Format output for synthesis."""
        if isinstance(output, str):
            return output
        elif isinstance(output, dict):
            if "summary" in output:
                return str(output["summary"])
            return str(output)
        return str(output)
    
    def _format_sources(self, sources: List[Dict[str, Any]]) -> str:
        """Format sources for prompt."""
        if not sources:
            return "No new sources"
        
        formatted = []
        for i, source in enumerate(sources[:5], 1):
            title = source.get("title", "Unknown")
            abstract = source.get("abstract", "")[:200]
            formatted.append(f"{i}. {title}\n   {abstract}...")
        
        return "\n\n".join(formatted)