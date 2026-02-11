import requests
from config.settings import SEMANTIC_SCHOLAR_URL, MAX_PAPERS

def search_papers(topic: str):
    params = {
        "query": topic,
        "limit": MAX_PAPERS,
        "fields": "title,authors,year,abstract"
    }

    response = requests.get(SEMANTIC_SCHOLAR_URL, params=params)

    if response.status_code != 200:
        return []

    papers = response.json().get("data", [])

    results = []
    for p in papers:
        results.append({
            "title": p.get("title"),
            "authors": [a["name"] for a in p.get("authors", [])],
            "year": p.get("year"),
            "abstract": p.get("abstract")
        })

    return results
