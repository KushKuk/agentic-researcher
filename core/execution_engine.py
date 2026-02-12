from core.execution_state import ExecutionState
from core.pipeline_loader import load_pipeline
from core.stage_runner import execute_stage


def run(topic: str):
    """
    Runs the full agentic research pipeline.

    Args:
        topic (str): research topic provided by user

    Returns:
        dict: structured execution results
    """

    print("[ExecutionEngine] Starting pipeline execution")

    # Load pipeline definition
    pipeline = load_pipeline()

    # Initialize execution state
    state = ExecutionState(topic)

    # Execute each stage in order
    for stage in pipeline:
        state = execute_stage(stage, state)

    print("[ExecutionEngine] Pipeline execution complete")

    # Return final structured results
    return state.to_dict()
