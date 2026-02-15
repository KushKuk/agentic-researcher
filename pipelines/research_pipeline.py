"""
Research pipeline that orchestrates the complete workflow.
Manages agent execution and state transitions.
"""
from typing import Dict, Any
from agents.planner_agent import PlannerAgent
from agents.base_agent import AgentState
from tools.semantic_scholar_tool import SemanticScholarTool
from config.config_settings import settings


class ResearchPipeline:
    """
    Main pipeline for orchestrating research workflows.
    """
    
    def __init__(self, max_steps: int = 10):
        """
        Initialize research pipeline.
        
        Args:
            max_steps: Maximum number of steps for agent execution
        """
        self.max_steps = max_steps
        
        # Initialize tools
        self.tools = [
            SemanticScholarTool(api_key=settings.semantic_scholar_api_key)
        ]
        
        # Initialize agent
        self.agent = PlannerAgent(tools=self.tools)
    
    async def run(self, task: str) -> Dict[str, Any]:
        """
        Execute the research pipeline.
        
        Args:
            task: Research task description
            
        Returns:
            Dictionary containing results and metadata
        """
        # Initialize state
        state = AgentState(
            messages=[],
            current_step=0,
            max_steps=self.max_steps,
            metadata={"task": task}
        )
        
        # Run agent loop
        while state.current_step < state.max_steps and not state.final_output and not state.error:
            state = await self.agent.process(state)
        
        # Return results
        return {
            "success": not bool(state.error),
            "task": task,
            "steps": state.current_step,
            "messages": state.messages,
            "final_output": state.final_output,
            "error": state.error
        }