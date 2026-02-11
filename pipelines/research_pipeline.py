from tools.research_search import search_papers
from agents.summarizer_agent import SummarizerAgent

summarizer = SummarizerAgent()

def run_pipeline(topic: str):

    results = {
        "topic": topic,
        "papers": []
    }

    search_results = search_papers(topic)

    if not search_results:
        return results

    for paper in search_results:

        try:
            summary = summarizer.summarize(paper)

            if summary:
                results["papers"].append(summary)

        except Exception as e:
            print(f"Summarization failed: {e}")

    return results
