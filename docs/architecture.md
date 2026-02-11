# System Architecture

## Overview

The system follows a layered agentic architecture designed for modularity, extensibility, and research experimentation.

The design separates decision-making from execution and memory.

---

## Architecture Layers

### API Layer
Handles incoming user requests and exposes endpoints for agent execution.

Technology:
- FastAPI

Responsibilities:
- request validation
- pipeline triggering
- result delivery

---

### Pipeline Layer
Coordinates execution of agents and tools.

Responsibilities:
- workflow orchestration
- future logging
- experiment control

---

### Agent Layer
Agents make decisions and control execution flow.

Current Agents:
- Planner Agent
- Summarizer Agent

Future Agents:

- Outreach Agent
- Self-Critique Agent

---

### Tool Layer
Tools perform actions requested by agents.

Examples:
- Research search tool
- Email automation tool (future)
- Web automation tool (future)

Agents do not directly call APIs.

---

### Memory Layer (Future)

Semantic Memory:
- Vector database (FAISS)

Relational Memory:
- Knowledge graph (Neo4j)

Structured Metadata:
- JSON / SQL storage

---

## Execution Flow

1. User submits research topic
2. API endpoint receives request
3. Pipeline triggers planner agent
4. Planner decides workflow
5. Tool executes research search
6. Results returned to user
