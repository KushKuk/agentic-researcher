"""
FastAPI application for the agentic research system.
Provides REST API endpoints for triggering research workflows.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from pipelines.research_pipeline import ResearchPipeline
from pipelines.paper_summarization_pipeline import PaperSummarizationPipeline
from pipelines.advanced_research_pipeline import AdvancedResearchPipeline,AdaptiveResearchPipeline
from pipelines.memory_enhanced_pipeline import MemoryEnhancedPipeline
from pipelines.knowledge_graph_pipeline import KnowledgeGraphPipeline

from agents.memory_agent import MemoryAgent
from agents.knowledge_graph_agent import KnowledgeGraphAgent
from config.settings import settings

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


class MemoryResearchRequest(BaseModel):
    """Request model for memory-enhanced research."""
    task: str
    max_steps: int = 15
    use_memory_context: bool = True
    auto_store: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "task": "Research recent advances in RAG systems",
                "max_steps": 15,
                "use_memory_context": True,
                "auto_store": True
            }
        }


class MemorySearchRequest(BaseModel):
    """Request model for memory search."""
    query: str
    top_k: int = 5
    min_similarity: float = 0.5
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "transformer architectures",
                "top_k": 5,
                "min_similarity": 0.5
            }
        }


class MemorySummarizationRequest(BaseModel):
    """Request model for memory-enhanced summarization."""
    query: str
    num_papers: int = 5
    store_in_memory: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "attention mechanisms in NLP",
                "num_papers": 5,
                "store_in_memory": True
            }
        }


# ── Phase 5: Knowledge Graph models ─────────────────────────────────────────

class GraphBuildRequest(BaseModel):
    """Request to search papers and build the knowledge graph."""
    query: str
    num_papers: int = 10
    store_in_memory: bool = True
    build_graph: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "query": "transformer architectures",
                "num_papers": 10,
                "store_in_memory": True,
                "build_graph": True,
            }
        }


class GraphQueryRequest(BaseModel):
    """Request to query the knowledge graph."""
    query_type: str
    params: Dict[str, Any] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "query_type": "papers_by_concept",
                "params": {"concept": "attention", "limit": 10},
            }
        }


class GraphIngestRequest(BaseModel):
    """Directly ingest papers into the knowledge graph."""
    papers: List[Dict[str, Any]]

    class Config:
        json_schema_extra = {
            "example": {
                "papers": [
                    {
                        "paper_id": "abc123",
                        "title": "Attention Is All You Need",
                        "abstract": "...",
                        "authors": ["Vaswani"],
                        "year": 2017,
                    }
                ]
            }
        }


# Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Agentic Research System",
        "version": "0.7.0",
        "phase": "Phase 7 - Self-Evaluation",
        "status": "running",
        "endpoints": {
            "research":          "/api/research",
            "summarize":         "/api/summarize",
            "advanced_research": "/api/advanced-research",
            "adaptive_research": "/api/adaptive-research",
            "memory_research":   "/api/memory-research",
            "memory_search":     "/api/memory/search",
            "memory_summarize":  "/api/memory/summarize",
            "memory_stats":      "/api/memory/stats",
            "graph_build":       "/api/graph/build",
            "graph_query":       "/api/graph/query",
            "graph_ingest":      "/api/graph/ingest",
            "graph_stats":       "/api/graph/stats",
            "graph_clear":       "/api/graph/clear",
            "outreach_campaign":  "/api/outreach/campaign",
            "outreach_targeted":   "/api/outreach/targeted",
            "outreach_email":      "/api/outreach/email",
            "iterative_research":  "/api/research/iterative",
            "evaluate_research":   "/api/evaluate/research",
            "health":            "/health",
            "docs":              "/docs",
        },
        "features": {
            "multi_step_reasoning": True,
            "error_recovery":       True,
            "self_reflection":      True,
            "vector_memory":        True,
            "semantic_search":      True,
            "knowledge_graph":      True,
            "entity_extraction":    True,
            "citation_networks":    True,
        },
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


@app.post("/api/memory-research")
async def execute_memory_research(request: MemoryResearchRequest):
    """
    Execute research with vector memory integration.
    
    Args:
        request: Memory-enhanced research request
        
    Returns:
        Research results with memory context and storage info
    """
    try:
        # Initialize memory-enhanced pipeline
        pipeline = MemoryEnhancedPipeline(
            max_steps=request.max_steps,
            enable_memory=True,
            auto_store=request.auto_store
        )
        
        # Execute with memory
        result = await pipeline.run(
            task=request.task,
            use_memory_context=request.use_memory_context
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing memory research: {str(e)}"
        )


@app.post("/api/memory/search")
async def search_memory(request: MemorySearchRequest):
    """
    Search vector memory for relevant papers.
    
    Args:
        request: Memory search request
        
    Returns:
        Relevant papers from memory
    """
    try:
        # Initialize pipeline with memory
        pipeline = MemoryEnhancedPipeline(enable_memory=True)
        
        # Search memory
        result = await pipeline.search_memory(
            query=request.query,
            top_k=request.top_k,
            min_similarity=request.min_similarity
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching memory: {str(e)}"
        )


@app.post("/api/memory/summarize")
async def memory_summarize_papers(request: MemorySummarizationRequest):
    """
    Research and summarize papers with automatic memory storage.
    
    Args:
        request: Memory summarization request
        
    Returns:
        Summaries with memory integration
    """
    try:
        # Initialize pipeline
        pipeline = MemoryEnhancedPipeline(
            enable_memory=True,
            auto_store=request.store_in_memory
        )
        
        # Execute with summarization
        result = await pipeline.run_with_summarization(
            query=request.query,
            num_papers=request.num_papers,
            store_in_memory=request.store_in_memory
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in memory summarization: {str(e)}"
        )


@app.get("/api/memory/stats")
async def get_memory_stats():
    """
    Get statistics about the vector memory store.
    
    Returns:
        Memory store statistics
    """
    try:
        # Initialize memory agent
        memory = MemoryAgent()
        
        stats = memory.get_memory_stats()
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting memory stats: {str(e)}"
        )


@app.delete("/api/memory/clear")
async def clear_memory():
    """Clear all data from vector memory."""
    try:
        memory = MemoryAgent()
        memory.clear_memory()
        return {"success": True, "message": "Memory cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing memory: {str(e)}")


# ── Phase 5: Knowledge Graph endpoints ───────────────────────────────────────

@app.post("/api/graph/build")
async def build_knowledge_graph(request: GraphBuildRequest):
    """
    Search papers, store in memory, and populate the knowledge graph.
    The main Phase 5 entry point.
    """
    try:
        pipeline = KnowledgeGraphPipeline(enable_memory=request.store_in_memory)
        result = await pipeline.run(
            query=request.query,
            num_papers=request.num_papers,
            store_in_memory=request.store_in_memory,
            build_graph=request.build_graph,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building graph: {str(e)}")


@app.post("/api/graph/query")
async def query_knowledge_graph(request: GraphQueryRequest):
    """
    Query the knowledge graph with a named query type.

    query_type options:
    - papers_by_concept  – params: concept, limit
    - papers_by_author   – params: author, limit
    - author_network     – params: author, depth
    - citation_network   – params: paper_id, depth
    - top_concepts       – params: limit
    - related_concepts   – params: concept, limit
    - search_papers      – params: keyword, limit
    - prolific_authors   – params: limit
    """
    try:
        pipeline = KnowledgeGraphPipeline()
        result = await pipeline.query_graph(
            query_type=request.query_type,
            params=request.params,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying graph: {str(e)}")


@app.post("/api/graph/ingest")
async def ingest_papers_to_graph(request: GraphIngestRequest):
    """Directly ingest a list of papers into the knowledge graph."""
    try:
        pipeline = KnowledgeGraphPipeline()
        result = await pipeline.ingest_papers_directly(request.papers)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ingesting papers: {str(e)}")


@app.get("/api/graph/stats")
async def get_graph_stats():
    """Return current knowledge graph statistics."""
    try:
        pipeline = KnowledgeGraphPipeline()
        return await pipeline.get_graph_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting graph stats: {str(e)}")


@app.delete("/api/graph/clear")
async def clear_graph():
    """Delete all nodes and relationships from the knowledge graph."""
    try:
        agent = KnowledgeGraphAgent()
        await agent.connect()
        await agent.graph.clear_graph()
        await agent.close()
        return {"success": True, "message": "Knowledge graph cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing graph: {str(e)}")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print("🚀 Agentic Research System starting...")
    print(f"📍 Environment: {settings.environment}")
    print(f"🔧 Model: {settings.default_model}")
    print("✅ System ready!")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("👋 Agentic Research System shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    )


# ── Citation endpoints ────────────────────────────────────────────────────────

class CitedResearchRequest(BaseModel):
    """Request for research with automatic citations."""
    task: str
    use_memory_context: bool = True
    citation_format: str = "numbered"  # "numbered" or "inline"
    
    class Config:
        json_schema_extra = {
            "example": {
                "task": "Summarize recent advances in transformer models",
                "citation_format": "numbered"
            }
        }


class CitedSummarizationRequest(BaseModel):
    """Request for paper summarization with citations."""
    query: str
    num_papers: int = 5
    store_in_memory: bool = True
    citation_format: str = "numbered"
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "attention mechanisms in NLP",
                "num_papers": 5,
                "citation_format": "numbered"
            }
        }


class VerifyClaimsRequest(BaseModel):
    """Request to verify summary claims against sources."""
    summary: str
    source_paper_ids: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "summary": "Transformers use self-attention...",
                "source_paper_ids": ["paper123", "paper456"]
            }
        }


@app.post("/api/research/cited")
async def research_with_citations(request: CitedResearchRequest):
    """
    Execute research with automatic citation attribution.
    
    Returns summary with each claim linked to its source paper.
    """
    try:
        from pipelines.cited_research_pipeline import CitedResearchPipeline
        
        pipeline = CitedResearchPipeline(enable_memory=True)
        result = await pipeline.run_with_citations(
            task=request.task,
            use_memory_context=request.use_memory_context,
            citation_format=request.citation_format
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/summarize/cited")
async def summarize_with_citations(request: CitedSummarizationRequest):
    """
    Summarize papers with citation attribution.
    
    Returns synthesis with each claim attributed to source papers,
    includes bibliography and verification metrics.
    """
    try:
        from pipelines.cited_research_pipeline import CitedResearchPipeline
        
        pipeline = CitedResearchPipeline(enable_memory=True)
        result = await pipeline.summarize_with_citations(
            query=request.query,
            num_papers=request.num_papers,
            store_in_memory=request.store_in_memory,
            citation_format=request.citation_format
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/verify/claims")
async def verify_claims(request: VerifyClaimsRequest):
    """
    Verify that summary claims are backed by specified source papers.
    
    Uses semantic similarity to match claims to papers from memory.
    """
    try:
        from pipelines.cited_research_pipeline import CitedResearchPipeline
        
        pipeline = CitedResearchPipeline(enable_memory=True)
        result = await pipeline.verify_claims(
            summary=request.summary,
            source_paper_ids=request.source_paper_ids
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ── Phase 6: Outreach Automation endpoints ────────────────────────────────────

class OutreachCampaignRequest(BaseModel):
    """Request to create outreach campaign from search query."""
    campaign_name: str
    query: str
    num_papers: int = 20
    email_type: str = "collaboration"  # collaboration, question, feedback, interview
    purpose: Optional[str] = None
    sender_name: str
    sender_affiliation: str
    sender_tone: str = "professional"
    filter_criteria: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "campaign_name": "transformer_researchers_2024",
                "query": "transformer models",
                "num_papers": 20,
                "email_type": "collaboration",
                "sender_name": "Dr. Jane Smith",
                "sender_affiliation": "Stanford University"
            }
        }


class TargetedCampaignRequest(BaseModel):
    """Request to create targeted campaign for specific authors."""
    campaign_name: str
    target_authors: List[str]
    email_type: str = "collaboration"
    purpose: Optional[str] = None
    sender_name: str
    sender_affiliation: str
    sender_tone: str = "professional"
    
    class Config:
        json_schema_extra = {
            "example": {
                "campaign_name": "collaboration_outreach",
                "target_authors": ["Yoshua Bengio", "Geoffrey Hinton"],
                "email_type": "collaboration",
                "sender_name": "Dr. Jane Smith",
                "sender_affiliation": "Stanford University"
            }
        }


class SingleEmailRequest(BaseModel):
    """Request to generate single personalized email."""
    recipient_name: str
    paper_ids: List[str]  # Papers to use as context
    email_type: str = "collaboration"
    sender_name: str
    sender_affiliation: str
    context: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "recipient_name": "Geoffrey Hinton",
                "paper_ids": ["paper123"],
                "email_type": "question",
                "sender_name": "Dr. Jane Smith",
                "sender_affiliation": "Stanford University",
                "context": {"question": "About the attention mechanism..."}
            }
        }


@app.post("/api/outreach/campaign")
async def create_outreach_campaign(request: OutreachCampaignRequest):
    """
    Create outreach campaign from search query.
    
    Searches papers, extracts author contacts, generates personalized emails,
    and exports campaign to CSV/JSON.
    """
    try:
        from pipelines.outreach_pipeline import OutreachPipeline
        from outreach import EmailType
        
        pipeline = OutreachPipeline(
            sender_name=request.sender_name,
            sender_affiliation=request.sender_affiliation,
            sender_tone=request.sender_tone
        )
        
        result = await pipeline.create_campaign_from_query(
            campaign_name=request.campaign_name,
            query=request.query,
            num_papers=request.num_papers,
            email_type=EmailType(request.email_type),
            purpose=request.purpose,
            filter_criteria=request.filter_criteria
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/outreach/targeted")
async def create_targeted_campaign(request: TargetedCampaignRequest):
    """
    Create targeted outreach campaign for specific authors.
    
    Finds papers by specified authors, generates personalized emails.
    """
    try:
        from pipelines.outreach_pipeline import OutreachPipeline
        from outreach import EmailType
        
        pipeline = OutreachPipeline(
            sender_name=request.sender_name,
            sender_affiliation=request.sender_affiliation,
            sender_tone=request.sender_tone
        )
        
        result = await pipeline.create_targeted_campaign(
            campaign_name=request.campaign_name,
            target_authors=request.target_authors,
            email_type=EmailType(request.email_type),
            purpose=request.purpose
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/outreach/email")
async def generate_single_email(request: SingleEmailRequest):
    """
    Generate single personalized outreach email.
    
    Uses specified papers as context for personalization.
    """
    try:
        from pipelines.outreach_pipeline import OutreachPipeline
        from outreach import EmailType
        from tools.semantic_scholar_tool import SemanticScholarTool
        
        pipeline = OutreachPipeline(
            sender_name=request.sender_name,
            sender_affiliation=request.sender_affiliation
        )
        
        # Fetch papers for context
        semantic_scholar = SemanticScholarTool()
        papers = []
        for paper_id in request.paper_ids:
            # Would need to fetch by ID - simplified here
            search_result = await semantic_scholar.execute(query=paper_id, limit=1)
            if search_result.success and search_result.data:
                papers.extend(search_result.data)
        
        result = await pipeline.generate_single_email(
            recipient_name=request.recipient_name,
            recipient_papers=papers,
            email_type=EmailType(request.email_type),
            context=request.context
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ── Phase 7: Self-Evaluation endpoints ────────────────────────────────────────

class IterativeResearchRequest(BaseModel):
    """Request for research with self-improvement."""
    task: str
    max_iterations: int = 3
    quality_threshold: float = 8.0
    use_memory: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "task": "Latest developments in quantum computing",
                "max_iterations": 3,
                "quality_threshold": 8.0
            }
        }


class EvaluateResearchRequest(BaseModel):
    """Request to evaluate existing research."""
    task: str
    output: str
    sources: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "task": "Transformer models overview",
                "output": "Transformers are neural networks...",
                "sources": [{"title": "Attention Is All You Need", "year": 2017}]
            }
        }


@app.post("/api/research/iterative")
async def iterative_research(request: IterativeResearchRequest):
    """
    Execute research with iterative self-improvement.
    
    Agent evaluates its own output, identifies gaps, and runs
    additional searches until quality threshold is met or
    max iterations reached.
    """
    try:
        from pipelines.iterative_research_pipeline import IterativeResearchPipeline
        
        pipeline = IterativeResearchPipeline(
            max_iterations=request.max_iterations,
            quality_threshold=request.quality_threshold,
            enable_memory=request.use_memory
        )
        
        result = await pipeline.run_with_self_improvement(task=request.task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/evaluate/research")
async def evaluate_research(request: EvaluateResearchRequest):
    """
    Evaluate existing research output.
    
    Provides quality scores, identifies weaknesses and gaps,
    and suggests specific improvements.
    """
    try:
        from pipelines.iterative_research_pipeline import IterativeResearchPipeline
        
        pipeline = IterativeResearchPipeline()
        
        result = await pipeline.evaluate_existing_research(
            task=request.task,
            output=request.output,
            sources=request.sources
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")