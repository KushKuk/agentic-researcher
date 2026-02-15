"""
Base tool interface for the agentic research system.
All tools inherit from this base class to ensure consistent structure.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict
from pydantic import BaseModel


class ToolResult(BaseModel):
    """Standardized tool result format."""
    success: bool
    data: Any
    error: str = ""
    metadata: Dict[str, Any] = {}


class BaseTool(ABC):
    """Abstract base class for all tools in the system."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name for identification."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Tool description for the LLM planner."""
        pass
    
    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute the tool with given parameters.
        
        Args:
            **kwargs: Tool-specific parameters
            
        Returns:
            ToolResult: Standardized result object
        """
        pass
    
    def _success(self, data: Any, metadata: Dict[str, Any] = None) -> ToolResult:
        """Helper to create success result."""
        return ToolResult(
            success=True,
            data=data,
            metadata=metadata or {}
        )
    
    def _error(self, error: str, metadata: Dict[str, Any] = None) -> ToolResult:
        """Helper to create error result."""
        return ToolResult(
            success=False,
            data=None,
            error=error,
            metadata=metadata or {}
        )