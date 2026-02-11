from tools.research_search import search_papers

class PlannerAgent:

    def run(self, topic: str):

        plan = [
            "search_papers"
        ]

        results = {}

        for step in plan:
            if step == "search_papers":
                results["papers"] = search_papers(topic)

        return results
