from core.stage_registry import run_stage


def execute_stage(stage, state):
    """
    Executes a single stage from the pipeline.

    Args:
        stage (dict): stage configuration from pipeline
        state (ExecutionState): current execution state

    Returns:
        ExecutionState: updated execution state
    """

    stage_name = stage.get("stage")

    if not stage_name:
        raise ValueError("Stage missing 'stage' key")

    print(f"[StageRunner] Executing stage: {stage_name}")

    state = run_stage(stage_name, state)

    return state
