"""
Base agent interface for the agentic research system.
All agents inherit from this base class to ensure consistent behavior.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List
from pydantic import BaseModel


class AgentState(BaseModel):
    """State object passed between agent nodes."""
    messages: List[Dict[str, Any]] = []
    current_step: int = 0
    max_steps: int = 10
    final_output: Any = None
    error: str = ""
    metadata: Dict[str, Any] = {}


class BaseAgent(ABC):
    """Abstract base class for all agents in the system."""
    
    def __init__(self, name: str, description: str):
        """
        Initialize base agent.
        
        Args:
            name: Agent identifier
            description: Agent purpose and capabilities
        """
        self.name = name
        self.description = description
    
    @abstractmethod
    async def process(self, state: AgentState) -> AgentState:
        """
        Main processing method for the agent.
        
        Args:
            state: Current agent state
            
        Returns:
            Updated agent state
        """
        pass
    
    def _should_continue(self, state: AgentState) -> bool:
        """
        Check if agent should continue processing.
        
        Args:
            state: Current agent state
            
        Returns:
            True if should continue, False otherwise
        """
        if state.error:
            return False
        
        if state.current_step >= state.max_steps:
            return False
        
        if state.final_output is not None:
            return False
        
        return True