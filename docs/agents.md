# Agent Documentation

## Planner Agent

### Purpose
Controls overall execution flow and determines which research workflows should be executed.

### Responsibilities
- define execution plan
- trigger research pipelines
- coordinate agents and tools
- manage workflow execution order
- aggregate final outputs

### Inputs
- research topic

### Outputs
- structured research intelligence dataset

### Current Logic
Deterministic workflow execution.

### Current Execution Flow
Planner → Research Pipeline → Tools → Agents → Structured Output

### Future Enhancements
- LLM-driven reasoning
- dynamic task decomposition
- adaptive workflow generation
- multi-agent orchestration
- iterative planning loops
- execution state tracking

### Pipelines Used
- research_pipeline

---

## Summarizer Agent

### Purpose
Transforms raw academic paper data into structured research insights.

### Responsibilities
- analyze academic abstracts
- extract research intelligence
- identify contributions and methodologies
- detect limitations and research gaps
- categorize research domains

### Inputs
- structured paper metadata:
  - title
  - authors
  - year
  - abstract

### Outputs
- structured research analysis
- summarized research insights

### Current Logic
LLM-based structured analysis.

### Future Enhancements
- comparative multi-paper analysis
- research trend detection
- novelty scoring
- automated research gap detection
- confidence scoring
- structured JSON schema enforcement

---

## Outreach Agent (Planned)

Purpose:
- generate personalized collaboration proposals
- create researcher outreach messages

Responsibilities:
- analyze research interests
- match collaboration opportunities
- draft professional communication

---

## Self-Critique Agent

Purpose:
- evaluate system outputs

Responsibilities:
- detect hallucinations
- evaluate summary accuracy
- assess research relevance
- score planner decisions

---

## Knowledge Graph Agent

Purpose:
- construct research knowledge graphs

Responsibilities:
- extract entities and relationships
- map authors and research areas
- track citation connections
- generate research networks

---

## Memory Agent

Purpose:
- manage long-term semantic memory

Responsibilities:
- store research embeddings
- maintain historical knowledge
- retrieve contextual information
