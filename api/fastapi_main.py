"""
FastAPI application for the agentic research system.
Provides REST API endpoints for triggering research workflows.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from pipelines import ResearchPipeline, PaperSummarizationPipeline
from config import settings

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


# Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Agentic Research System",
        "version": "0.2.0",
        "phase": "Phase 2 - Paper Summarization",
        "status": "running",
        "endpoints": {
            "research": "/api/research",
            "summarize": "/api/summarize",
            "summarize_url": "/api/summarize-url",
            "health": "/health",
            "tools": "/api/tools",
            "docs": "/docs"
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


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print("Agentic Research System starting...")
    print(f"Environment: {settings.environment}")
    print(f"Model: {settings.default_model}")
    print("System ready!")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("Agentic Research System shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    )