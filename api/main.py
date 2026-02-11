from fastapi import FastAPI
from pipelines.research_pipeline import run_pipeline

app = FastAPI()

@app.get("/")
def root():
    return {"status": "agent running"}

@app.get("/research")
def research(topic: str):
    result = run_pipeline(topic)
    return result
