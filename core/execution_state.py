class ExecutionState:
    def __init__(self, topic: str):
        self.topic = topic
        self.plan = None
        self.raw_papers = []
        self.summaries = []
        self.errors = []

    def to_dict(self):
        return {
            "topic": self.topic,
            "plan": self.plan,
            "papers": self.summaries,
            "errors": self.errors
        }
