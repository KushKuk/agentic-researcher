"""
FastAPI application for the agentic research system.
Provides REST API endpoints for triggering research workflows.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from pipelines import ResearchPipeline
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
    allow_origins=["*"],
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


# Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Agentic Research System",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "research": "/api/research",
            "health": "/health",
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