"""
FastAPI application for the agentic research system.
Provides REST API endpoints for triggering research workflows.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from pipelines.research_pipeline import ResearchPipeline
from pipelines.paper_summarization_pipeline import PaperSummarizationPipeline
from pipelines.advanced_research_pipeline import AdvancedResearchPipeline, AdaptiveResearchPipeline
from config.config_settings import settings

# Initialize FastAPI app
app = FastAPI(
    title="Agentic Research System",
    description="Autonomous AI system for research discovery and knowledge extraction",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class ResearchRequest(BaseModel):
    """Request model for research tasks."""
    task: str
    max_steps: int = 10
    
    class Config:
        json_schema_extra = {
            "example": {
                "task": "Find recent papers on transformer architectures in NLP",
                "max_steps": 10
            }
        }


class ResearchResponse(BaseModel):
    """Response model for research results."""
    success: bool
    task: str
    steps: int
    final_output: Any
    error: str = ""


class PaperSummarizationRequest(BaseModel):
    """Request model for paper summarization."""
    query: str
    num_papers: int = 3
    summarize: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "transformer architectures for NLP",
                "num_papers": 3,
                "summarize": True
            }
        }


class PaperSummarizationResponse(BaseModel):
    """Response model for paper summarization."""
    query: str
    papers: list
    summaries: list
    errors: list = []


class AdvancedResearchRequest(BaseModel):
    """Request model for advanced research."""
    task: str
    max_steps: int = 15
    enable_reflection: bool = True
    context: Dict[str, Any] = {}
    
    class Config:
        json_schema_extra = {
            "example": {
                "task": "Analyze recent advances in retrieval augmented generation",
                "max_steps": 15,
                "enable_reflection": True,
                "context": {"focus": "practical applications"}
            }
        }


class AdvancedResearchResponse(BaseModel):
    """Response model for advanced research."""
    success: bool
    task: str
    steps: int
    final_output: Any
    error: str = ""
    execution_time_seconds: float
    reflection: Optional[Dict[str, Any]] = None
    reasoning_history: list = []


class AdaptiveResearchRequest(BaseModel):
    """Request model for adaptive research."""
    task: str
    strategy: str = "auto"  # auto, simple, sequential, advanced
    
    class Config:
        json_schema_extra = {
            "example": {
                "task": "Find and compare papers on attention mechanisms",
                "strategy": "auto"
            }
        }


# Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Agentic Research System",
        "version": "0.3.0",
        "phase": "Phase 3 - Advanced LLM Planner",
        "status": "running",
        "endpoints": {
            "research": "/api/research",
            "summarize": "/api/summarize",
            "summarize_url": "/api/summarize-url",
            "advanced_research": "/api/advanced-research",
            "adaptive_research": "/api/adaptive-research",
            "health": "/health",
            "tools": "/api/tools",
            "docs": "/docs"
        },
        "features": {
            "multi_step_reasoning": True,
            "error_recovery": True,
            "self_reflection": True,
            "parallel_execution": "experimental"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.environment
    }


@app.post("/api/research", response_model=ResearchResponse)
async def execute_research(request: ResearchRequest):
    """
    Execute a research task using the agentic system.
    
    Args:
        request: Research request with task description
        
    Returns:
        Research results and metadata
    """
    try:
        # Initialize pipeline
        pipeline = ResearchPipeline(max_steps=request.max_steps)
        
        # Execute research
        result = await pipeline.run(request.task)
        
        return ResearchResponse(
            success=result["success"],
            task=result["task"],
            steps=result["steps"],
            final_output=result["final_output"],
            error=result.get("error", "")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing research: {str(e)}"
        )


@app.get("/api/tools")
async def list_tools():
    """
    List available tools in the system.
    
    Returns:
        Dictionary of available tools and their descriptions
    """
    pipeline = ResearchPipeline()
    
    return {
        "tools": [
            {
                "name": tool.name,
                "description": tool.description
            }
            for tool in pipeline.tools
        ]
    }


@app.post("/api/summarize", response_model=PaperSummarizationResponse)
async def summarize_papers(request: PaperSummarizationRequest):
    """
    Search for papers and generate summaries.
    
    Args:
        request: Paper summarization request
        
    Returns:
        Papers with summaries
    """
    try:
        # Initialize pipeline
        pipeline = PaperSummarizationPipeline()
        
        # Execute summarization
        result = await pipeline.run(
            query=request.query,
            num_papers=request.num_papers,
            summarize=request.summarize
        )
        
        return PaperSummarizationResponse(
            query=result["query"],
            papers=result["papers"],
            summaries=result["summaries"],
            errors=result.get("errors", [])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error summarizing papers: {str(e)}"
        )


@app.post("/api/summarize-url")
async def summarize_from_url(pdf_url: str, title: str = "Unknown"):
    """
    Summarize a paper from a direct PDF URL.
    
    Args:
        pdf_url: Direct URL to PDF file
        title: Optional paper title
        
    Returns:
        Summary results
    """
    try:
        pipeline = PaperSummarizationPipeline()
        result = await pipeline.summarize_from_url(pdf_url=pdf_url, title=title)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing PDF: {str(e)}"
        )


@app.post("/api/advanced-research", response_model=AdvancedResearchResponse)
async def execute_advanced_research(request: AdvancedResearchRequest):
    """
    Execute advanced research with multi-step reasoning and reflection.
    
    Args:
        request: Advanced research request
        
    Returns:
        Enhanced research results with reasoning history
    """
    try:
        # Initialize advanced pipeline
        pipeline = AdvancedResearchPipeline(
            max_steps=request.max_steps,
            enable_reflection=request.enable_reflection
        )
        
        # Execute with context
        result = await pipeline.run(
            task=request.task,
            context=request.context
        )
        
        return AdvancedResearchResponse(
            success=result["success"],
            task=result["task"],
            steps=result["steps"],
            final_output=result["final_output"],
            error=result.get("error", ""),
            execution_time_seconds=result["execution_time_seconds"],
            reflection=result.get("reflection"),
            reasoning_history=result.get("reasoning_history", [])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing advanced research: {str(e)}"
        )


@app.post("/api/adaptive-research")
async def execute_adaptive_research(request: AdaptiveResearchRequest):
    """
    Execute research with adaptive strategy selection.
    
    Args:
        request: Adaptive research request
        
    Returns:
        Research results with strategy used
    """
    try:
        # Initialize adaptive pipeline
        pipeline = AdaptiveResearchPipeline()
        
        # Execute with strategy
        result = await pipeline.run(
            task=request.task,
            strategy=request.strategy
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing adaptive research: {str(e)}"
        )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print("Agentic Research System starting")
    print(f"Environment: {settings.environment}")
    print(f"Model: {settings.default_model}")
    print("System ready!")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("Agentic Research System shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    )