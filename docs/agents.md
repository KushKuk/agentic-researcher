# Agent Documentation

## Planner Agent

### Purpose
Controls execution flow and determines which tools and actions should be performed.

### Responsibilities
- define execution plan
- call tools
- collect results
- coordinate pipeline execution

### Inputs
- research topic

### Outputs
- structured research results

### Current Logic
Deterministic planning.

Future:
- LLM-based reasoning
- dynamic task decomposition
- multi-agent coordination

### Tools Used
- research_search tool

---

## Future Agents

### Summarizer Agent
- extracts research insights
- identifies contributions
- detects limitations

### Outreach Agent
- generates personalized collaboration emails
- proposes meetings

### Self-Critique Agent
- evaluates outputs
- improves performance over time
