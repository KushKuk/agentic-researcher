import requests

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/"

FIELDS = "title,abstract,year,authors,venue"

def fetch_paper(paper_id: str):
    url = f"{SEMANTIC_SCHOLAR_URL}{paper_id}?fields={FIELDS}"

    response = requests.get(url)

    if response.status_code != 200:
        return None

    data = response.json()

    return {
        "paper_id": paper_id,
        "title": data.get("title"),
        "abstract": data.get("abstract"),
        "year": data.get("year"),
        "authors": [a["name"] for a in data.get("authors", [])],
        "venue": data.get("venue")
    }
