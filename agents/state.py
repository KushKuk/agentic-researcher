from typing import Dict, List, Any

class AgentState:

    def __init__(self, topic: str):
        self.topic = topic
        self.steps_completed: List[str] = []
        self.results: Dict[str, Any] = {}
        self.reasoning_log: List[str] = []
        self.errors: List[str] = []

    def add_step(self, step: str):
        self.steps_completed.append(step)

    def add_result(self, key: str, value: Any):
        self.results[key] = value

    def log_reasoning(self, message: str):
        self.reasoning_log.append(message)

    def log_error(self, error: str):
        self.errors.append(error)
