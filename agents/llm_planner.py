from openai import OpenAI
from config.planner_schema import (
    AVAILABLE_PIPELINES,
    PLANNER_SYSTEM_PROMPT
)

client = OpenAI()

class LLMPlanner:

    def generate_plan(self, topic: str):

        prompt = f"""
Research Goal:
{topic}

Available Pipelines:
{AVAILABLE_PIPELINES}

Return execution plan.
"""

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )

        content = response.choices[0].message.content

        try:
            plan = eval(content)
        except:
            plan = ["research_pipeline"]

        return plan
