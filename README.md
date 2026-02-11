# Agentic Research & Outreach System

## Overview

This project implements an autonomous agentic AI system that performs research discovery, knowledge extraction, and intelligent collaboration outreach.

The system uses a modular architecture consisting of agents, tools, pipelines, and memory layers to autonomously execute research workflows.

Current capabilities include:

- Autonomous research topic ingestion
- Academic paper discovery via APIs
- Planner-based agent workflow execution
- Modular tool architecture
- FastAPI backend for agent execution

Future capabilities:

- Multi-agent reasoning
- Semantic memory with vector databases
- Knowledge graph construction
- Automated research outreach
- Self-critique and evaluation loops

---

## System Architecture (High Level)

User Request → FastAPI API → Pipeline → Planner Agent → Tools → External APIs

---

## Tech Stack

- Python
- FastAPI
- LangGraph (agent orchestration)
- Semantic Scholar API
- Modular Tool Architecture

Future:

- FAISS (vector memory)
- Neo4j (knowledge graph)
- Sentence Transformers (embeddings)

---

## Installation

Create virtual environment:

```bash
python -m venv venv
```

Activate virtual environment:

Windows:

```bash
venv\Scripts\activate
```

Linux/MacOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Running the System

Start backend server:

```bash
uvicorn api.main:app --reload
```

Open API docs:

```yaml
http://127.0.0.1:8000/docs
```

---

## Project Structure

```
agentic-researcher/
├── api/
├── agents/
├── config/
├── docs/
├── pipelines/
├── tools/
└── requirements.txt
```

---

## Development Roadmap

Phase 1 – Core Infrastructure  
Phase 2 – Paper Summarization Agent  
Phase 3 – LLM Planner  
Phase 4 – Vector Memory Integration  
Phase 5 – Knowledge Graph Construction  
Phase 6 – Outreach Automation  
Phase 7 – Self-Evaluation Agent

---

## License

MIT License