from agents.planner_agent import PlannerAgent
from agents.summarizer_agent import SummarizerAgent
from tools.research_search import search_papers

planner = PlannerAgent()
summarizer = SummarizerAgent()


def run_stage(stage_name, state):
    """
    Executes a specific stage based on stage name.

    Args:
        stage_name (str): name of the stage to execute
        state (ExecutionState): current execution state

    Returns:
        ExecutionState: updated state
    """

    if stage_name == "plan":
        state.plan = planner.run(state.topic)

    elif stage_name == "search":
        papers = search_papers(state.topic)
        state.raw_papers = papers

    elif stage_name == "summarize":

        for paper in state.raw_papers:
            try:
                summary = summarizer.summarize(paper)

                if summary:
                    state.summaries.append(summary)

            except Exception as e:
                state.errors.append(str(e))

    else:
        raise ValueError(f"Unknown stage: {stage_name}")

    return state
