from agents.state import AgentState
from core.execution_engine import ExecutionEngine
from agents.llm_planner import LLMPlanner
from pipelines.research_pipeline import run_pipeline

class PlannerAgent:

    def __init__(self):

        self.engine = ExecutionEngine()
        self.llm_planner = LLMPlanner()

        self.pipeline_map = {
            "research_pipeline": run_pipeline
        }

    def run(self, topic: str):

        state = AgentState(topic)

        plan = self.llm_planner.generate_plan(topic)

        state.log_reasoning(f"Generated Plan: {plan}")

        final_state = self.engine.execute(
            plan=plan,
            state=state,
            pipeline_map=self.pipeline_map
        )

        return {
            "topic": final_state.topic,
            "steps": final_state.steps_completed,
            "results": final_state.results,
            "reasoning": final_state.reasoning_log,
            "errors": final_state.errors
        }
