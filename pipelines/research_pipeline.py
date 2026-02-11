from agents.planner_agent import PlannerAgent

planner = PlannerAgent()

def run_pipeline(topic: str):
    return planner.run(topic)
