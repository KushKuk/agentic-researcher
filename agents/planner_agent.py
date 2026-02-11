from pipelines.research_pipeline import run_pipeline

class PlannerAgent:

    def run(self, topic: str):

        plan = [
            "research_pipeline"
        ]

        results = {}

        for step in plan:
            if step == "research_pipeline":
                results = run_pipeline(topic)

        return results
