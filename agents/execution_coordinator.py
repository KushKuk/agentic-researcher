"""
Execution coordinator for managing tool execution strategies.
Supports sequential and parallel execution with error recovery.
"""
import asyncio
from typing import List, Dict, Any, Tuple
from tools.base_tool import BaseTool, ToolResult


class ExecutionCoordinator:
    """
    Coordinates tool execution with support for parallel operations.
    
    Features:
    - Sequential execution (default)
    - Parallel execution for independent operations
    - Error recovery and retry logic
    - Execution time tracking
    - Result aggregation
    """
    
    def __init__(
        self,
        max_parallel: int = 3,
        retry_on_failure: bool = True,
        max_retries: int = 2
    ):
        """
        Initialize execution coordinator.
        
        Args:
            max_parallel: Maximum parallel tool executions
            retry_on_failure: Whether to retry failed operations
            max_retries: Maximum retry attempts
        """
        self.max_parallel = max_parallel
        self.retry_on_failure = retry_on_failure
        self.max_retries = max_retries
    
    async def execute_sequential(
        self,
        tools: List[Tuple[BaseTool, Dict[str, Any]]]
    ) -> List[ToolResult]:
        """
        Execute tools sequentially (one after another).
        
        Args:
            tools: List of (tool, params) tuples
            
        Returns:
            List of ToolResults in order
        """
        results = []
        
        for tool, params in tools:
            result = await self._execute_with_retry(tool, params)
            results.append(result)
            
            # Stop on critical failure if configured
            if not result.success and not self.retry_on_failure:
                break
        
        return results
    
    async def execute_parallel(
        self,
        tools: List[Tuple[BaseTool, Dict[str, Any]]]
    ) -> List[ToolResult]:
        """
        Execute tools in parallel (concurrently).
        
        Args:
            tools: List of (tool, params) tuples
            
        Returns:
            List of ToolResults in original order
        """
        # Create tasks
        tasks = [
            self._execute_with_retry(tool, params)
            for tool, params in tools
        ]
        
        # Execute with concurrency limit
        results = []
        for i in range(0, len(tasks), self.max_parallel):
            batch = tasks[i:i + self.max_parallel]
            batch_results = await asyncio.gather(*batch, return_exceptions=True)
            
            # Convert exceptions to error results
            for result in batch_results:
                if isinstance(result, Exception):
                    error_result = ToolResult(
                        success=False,
                        data=None,
                        error=str(result)
                    )
                    results.append(error_result)
                else:
                    results.append(result)
        
        return results
    
    async def execute_with_dependencies(
        self,
        execution_plan: Dict[str, Any]
    ) -> Dict[str, ToolResult]:
        """
        Execute tools respecting dependencies.
        
        Args:
            execution_plan: Dictionary defining execution order and dependencies
            Example:
            {
                "step1": {
                    "tool": tool1,
                    "params": {},
                    "depends_on": []
                },
                "step2": {
                    "tool": tool2,
                    "params": {},
                    "depends_on": ["step1"]
                }
            }
            
        Returns:
            Dictionary mapping step names to results
        """
        results = {}
        completed = set()
        
        # Keep executing until all steps done
        while len(completed) < len(execution_plan):
            # Find steps ready to execute
            ready = []
            
            for step_name, step_info in execution_plan.items():
                if step_name in completed:
                    continue
                
                dependencies = step_info.get("depends_on", [])
                if all(dep in completed for dep in dependencies):
                    ready.append(step_name)
            
            if not ready:
                # Circular dependency or error
                break
            
            # Execute ready steps in parallel
            tasks = []
            for step_name in ready:
                step_info = execution_plan[step_name]
                tool = step_info["tool"]
                params = step_info["params"]
                tasks.append(self._execute_with_retry(tool, params))
            
            step_results = await asyncio.gather(*tasks)
            
            # Store results
            for step_name, result in zip(ready, step_results):
                results[step_name] = result
                completed.add(step_name)
        
        return results
    
    async def _execute_with_retry(
        self,
        tool: BaseTool,
        params: Dict[str, Any]
    ) -> ToolResult:
        """
        Execute tool with retry logic.
        
        Args:
            tool: Tool to execute
            params: Tool parameters
            
        Returns:
            ToolResult
        """
        last_error = None
        
        for attempt in range(self.max_retries + 1):
            try:
                result = await tool.execute(**params)
                
                if result.success or not self.retry_on_failure:
                    return result
                
                last_error = result.error
                
                # Exponential backoff
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)
                    
            except Exception as e:
                last_error = str(e)
                
                if attempt < self.max_retries and self.retry_on_failure:
                    await asyncio.sleep(2 ** attempt)
                else:
                    return ToolResult(
                        success=False,
                        data=None,
                        error=last_error or "Unknown error"
                    )
        
        return ToolResult(
            success=False,
            data=None,
            error=f"Failed after {self.max_retries + 1} attempts: {last_error}"
        )
    
    def analyze_execution_strategy(
        self,
        tools: List[BaseTool],
        context: Dict[str, Any]
    ) -> str:
        """
        Analyze which execution strategy is best.
        
        Args:
            tools: List of tools to execute
            context: Current context/state
            
        Returns:
            Recommended strategy: "sequential", "parallel", or "dependency"
        """
        # Simple heuristic for now
        if len(tools) <= 1:
            return "sequential"
        
        # Check if tools are independent (can run in parallel)
        # For Phase 3, we'll use a simple check
        # Future: analyze actual dependencies
        
        tool_types = [tool.name for tool in tools]
        
        # If all same type of search operations, can parallelize
        if all("search" in name for name in tool_types):
            return "parallel"
        
        # If contains downloads + parsing, must be sequential
        if "pdf_downloader" in tool_types and "pdf_parser" in tool_types:
            return "sequential"
        
        return "sequential"
    
    def create_execution_report(
        self,
        results: List[ToolResult],
        execution_time: float
    ) -> Dict[str, Any]:
        """
        Create execution report with statistics.
        
        Args:
            results: List of tool results
            execution_time: Total execution time in seconds
            
        Returns:
            Report dictionary
        """
        total = len(results)
        successful = sum(1 for r in results if r.success)
        failed = total - successful
        
        return {
            "total_operations": total,
            "successful": successful,
            "failed": failed,
            "success_rate": successful / total if total > 0 else 0,
            "execution_time_seconds": execution_time,
            "average_time_per_operation": execution_time / total if total > 0 else 0,
            "errors": [r.error for r in results if not r.success]
        }