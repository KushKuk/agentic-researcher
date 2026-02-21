"""
Advanced research pipeline with multi-step reasoning and parallel execution.
Phase 3 enhancements for intelligent orchestration.
"""
from typing import Dict, Any, Optional
import time
from agents.advanced_planner_agent import AdvancedPlannerAgent
from agents.base_agent import AgentState
from agents.execution_coordinator import ExecutionCoordinator
from tools.semantic_scholar_tool import SemanticScholarTool
from tools.pdf_downloader_tool import PDFDownloaderTool
from tools.pdf_parser_tool import PDFParserTool
from config.settings import settings


class AdvancedResearchPipeline:
    """
    Enhanced pipeline with advanced planning and execution strategies.
    
    Features:
    - Advanced multi-step reasoning
    - Error recovery and replanning
    - Parallel tool execution
    - Execution time tracking
    - Self-reflection on results
    """
    
    def __init__(
        self,
        max_steps: int = 15,
        enable_reflection: bool = True,
        enable_parallel: bool = False  # Phase 3 feature
    ):
        """
        Initialize advanced research pipeline.
        
        Args:
            max_steps: Maximum planning steps
            enable_reflection: Enable self-reflection
            enable_parallel: Enable parallel execution (experimental)
        """
        self.max_steps = max_steps
        self.enable_reflection = enable_reflection
        self.enable_parallel = enable_parallel
        
        # Initialize tools
        self.tools = [
            SemanticScholarTool(api_key=settings.semantic_scholar_api_key),
            PDFDownloaderTool(),
            PDFParserTool()
        ]
        
        # Initialize advanced planner
        self.planner = AdvancedPlannerAgent(
            tools=self.tools,
            enable_reflection=enable_reflection
        )
        
        # Initialize execution coordinator
        self.coordinator = ExecutionCoordinator(
            max_parallel=3,
            retry_on_failure=True,
            max_retries=2
        )
    
    async def run(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute advanced research workflow.
        
        Args:
            task: Research task description
            context: Optional additional context
            
        Returns:
            Results with enhanced metadata
        """
        start_time = time.time()
        
        # Initialize state with context
        state = AgentState(
            messages=[],
            current_step=0,
            max_steps=self.max_steps,
            metadata={
                "task": task,
                "context": context or {},
                "start_time": start_time
            }
        )
        
        # Run advanced planner loop
        while state.current_step < state.max_steps and not state.final_output and not state.error:
            state = await self.planner.process(state)
        
        execution_time = time.time() - start_time
        
        # Build enhanced result
        result = {
            "success": not bool(state.error),
            "task": task,
            "steps": state.current_step,
            "messages": state.messages,
            "final_output": state.final_output,
            "error": state.error,
            "execution_time_seconds": execution_time,
            "reflection": state.metadata.get("reflection"),
            "reasoning_history": state.metadata.get("reasoning_history", [])
        }
        
        return result
    
    async def run_with_plan(
        self,
        task: str,
        explicit_plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute with an explicit execution plan.
        
        Args:
            task: Research task
            explicit_plan: Predefined execution plan
            
        Returns:
            Execution results
        """
        start_time = time.time()
        
        # Execute plan with coordinator
        results = await self.coordinator.execute_with_dependencies(explicit_plan)
        
        execution_time = time.time() - start_time
        
        # Create report
        result_list = list(results.values())
        report = self.coordinator.create_execution_report(result_list, execution_time)
        
        return {
            "success": report["success_rate"] > 0.5,
            "task": task,
            "plan_results": results,
            "execution_report": report,
            "execution_time_seconds": execution_time
        }
    
    async def analyze_and_execute(
        self,
        task: str
    ) -> Dict[str, Any]:
        """
        Analyze task complexity and choose execution strategy.
        
        Args:
            task: Research task
            
        Returns:
            Results with strategy info
        """
        # For Phase 3, use advanced planner by default
        # Future: Add task complexity analysis
        
        result = await self.run(task)
        
        # Add strategy metadata
        result["execution_strategy"] = "advanced_planner"
        result["features_used"] = {
            "multi_step_reasoning": True,
            "error_recovery": True,
            "reflection": self.enable_reflection,
            "parallel_execution": self.enable_parallel
        }
        
        return result


class AdaptiveResearchPipeline:
    """
    Adaptive pipeline that switches strategies based on task type.
    
    Strategies:
    - Simple: Single tool, direct execution
    - Sequential: Multiple tools, ordered execution
    - Advanced: Complex reasoning, error recovery, reflection
    """
    
    def __init__(self):
        """Initialize adaptive pipeline."""
        self.advanced_pipeline = AdvancedResearchPipeline()
    
    async def run(
        self,
        task: str,
        strategy: str = "auto"
    ) -> Dict[str, Any]:
        """
        Run with adaptive strategy selection.
        
        Args:
            task: Research task
            strategy: "auto", "simple", "sequential", or "advanced"
            
        Returns:
            Results with strategy used
        """
        # Determine strategy
        if strategy == "auto":
            strategy = self._determine_strategy(task)
        
        # Execute with selected strategy
        if strategy == "advanced":
            result = await self.advanced_pipeline.run(task)
        else:
            # Fallback to advanced for now
            result = await self.advanced_pipeline.run(task)
        
        result["strategy_used"] = strategy
        return result
    
    def _determine_strategy(self, task: str) -> str:
        """
        Determine best strategy for task.
        
        Args:
            task: Task description
            
        Returns:
            Strategy name
        """
        task_lower = task.lower()
        
        # Simple keywords
        simple_keywords = ["find", "search", "list"]
        complex_keywords = ["analyze", "compare", "summarize", "evaluate", "research"]
        
        # Check for complexity indicators
        if any(kw in task_lower for kw in complex_keywords):
            return "advanced"
        
        if any(kw in task_lower for kw in simple_keywords):
            return "sequential"
        
        # Default to advanced for best results
        return "advanced"