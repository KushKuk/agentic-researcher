"""
Planner agent that uses LLM to orchestrate tool usage.
This agent reasons about which tools to use and in what order.
"""
from typing import Dict, Any, Optional, Sequence
from langchain.prompts import ChatPromptTemplate
from agents.base_agent import BaseAgent, AgentState
from tools.base_tool import BaseTool
from agents.llm_factory import create_llm


class PlannerAgent(BaseAgent):
    """
    Agent that plans and executes research workflows using available tools.
    """
    
    PLANNER_PROMPT = """You are a research planning agent. Your job is to break down research requests into actionable steps using available tools.

Available tools:
{tool_descriptions}

Current state:
Task: {task}
Previous steps: {previous_steps}
Current step: {current_step}/{max_steps}

Based on the task and previous steps, decide what to do next:
1. If you need to search for papers, use the semantic_scholar_search tool
2. If you have gathered enough information, provide a final summary
3. If you're stuck or reached max steps, provide what you have so far

Respond in JSON format:
{{
    "reasoning": "your reasoning here",
    "action": "tool_name or 'finish'",
    "parameters": {{"param": "value"}},
    "summary": "brief summary of what you're doing"
}}
"""
    
    def __init__(
        self,
        tools: Sequence[BaseTool],
        model: Optional[str] = None,
        temperature: float = 0.7
    ):
        """
        Initialize planner agent.
        
        Args:
            tools: List of available tools
            model: LLM model name (defaults to config)
            temperature: LLM temperature
        """
        super().__init__(
            name="planner_agent",
            description="Orchestrates research workflows using available tools"
        )
        
        self.tools = {tool.name: tool for tool in tools}
        self.llm = create_llm(
            model=model,
            temperature=temperature
        )
        
        self.prompt = ChatPromptTemplate.from_template(self.PLANNER_PROMPT)
    
    async def process(self, state: AgentState) -> AgentState:
        """
        Process the current state and decide next action.
        
        Args:
            state: Current agent state
            
        Returns:
            Updated agent state
        """
        # Check if should continue
        if not self._should_continue(state):
            return state
        
        # Get task from metadata
        task = state.metadata.get("task", "No task specified")
        
        # Format tool descriptions
        tool_descriptions = "\n".join([
            f"- {name}: {tool.description}"
            for name, tool in self.tools.items()
        ])
        
        # Format previous steps
        previous_steps = "\n".join([
            f"Step {i+1}: {msg.get('summary', 'No summary')}"
            for i, msg in enumerate(state.messages)
        ])
        
        # Create prompt
        prompt_text = self.prompt.format(
            tool_descriptions=tool_descriptions,
            task=task,
            previous_steps=previous_steps or "None yet",
            current_step=state.current_step + 1,
            max_steps=state.max_steps
        )
        
        try:
            # Get LLM decision
            response = await self.llm.ainvoke(prompt_text)
            
            # Parse response (simplified - in production use structured output)
            decision = self._parse_decision(self._extract_text(response.content))
            
            # Execute action
            if decision["action"] == "finish":
                state.final_output = {
                    "summary": decision.get("summary", "Task completed"),
                    "messages": state.messages
                }
            elif decision["action"] in self.tools:
                # Execute tool
                tool = self.tools[decision["action"]]
                result = await tool.execute(**decision.get("parameters", {}))
                
                # Add to messages
                state.messages.append({
                    "step": state.current_step + 1,
                    "action": decision["action"],
                    "reasoning": decision.get("reasoning", ""),
                    "summary": decision.get("summary", ""),
                    "result": result.model_dump() if hasattr(result, 'model_dump') else result
                })
            else:
                state.error = f"Unknown action: {decision['action']}"
            
            # Increment step
            state.current_step += 1
            
        except Exception as e:
            state.error = f"Error in planner: {str(e)}"
        
        return state
    
    def _extract_text(self, content: "str | list") -> str:
        """
        Normalise Gemini response content to a plain string.

        Args:
            content: Raw response.content from the LLM.

        Returns:
            A single concatenated string.
        """
        if isinstance(content, str):
            return content
        # List of blocks – extract text from each
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text", "")))
            else:
                parts.append(str(block))
        return "\n".join(parts)
    
    def _parse_decision(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured decision.
        
        Args:
            response: LLM response text
            
        Returns:
            Structured decision dictionary
        """
        # Simplified parsing - in production use JSON mode or structured output
        import json
        import re
        
        # Strip markdown code fences
        clean = re.sub(r"```(?:json)?|```", "", response).strip()
        
        try:
            # Try to extract JSON from cleaned response
            json_match = re.search(r'\{.*\}', clean, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass
        
        # Fallback decision
        return {
            "reasoning": "Could not parse LLM response",
            "action": "finish",
            "parameters": {},
            "summary": response[:200]
        }