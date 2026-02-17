"""
Advanced planner agent with multi-step reasoning and dynamic replanning.
Includes reflection, error recovery, and context-aware decision making.
"""
from typing import List, Dict, Any, Optional
from langchain.prompts import ChatPromptTemplate
from agents.base_agent import BaseAgent, AgentState
from tools.base_tool import BaseTool
from llm_factory import create_llm
import json


class AdvancedPlannerAgent(BaseAgent):
    """
    Enhanced planner with multi-step reasoning, reflection, and replanning.
    
    Features:
    - Multi-step plan generation
    - Context-aware decision making
    - Error recovery and replanning
    - Progress evaluation
    - Parallel tool execution support (future)
    """
    
    PLANNING_PROMPT = """You are an advanced research planning agent with multi-step reasoning capabilities.

Available tools:
{tool_descriptions}

Current state:
Task: {task}
Current step: {current_step}/{max_steps}
Previous steps executed: {steps_summary}

Previous results:
{results_summary}

Your job is to:
1. Analyze what has been accomplished so far
2. Evaluate if the task is complete or needs more work
3. Decide the next best action based on context
4. If errors occurred, adapt your strategy

Response format (JSON):
{{
    "analysis": "Brief analysis of current situation and what's been accomplished",
    "is_complete": false,
    "next_action": "tool_name or 'finish'",
    "reasoning": "Why this action makes sense given the context",
    "parameters": {{"param": "value"}},
    "fallback_action": "Alternative action if primary fails",
    "expected_outcome": "What you expect this action to achieve"
}}

Rules:
- If task is complete, set is_complete: true and next_action: "finish"
- If previous action failed, consider fallback strategies
- Consider what information you have vs what you need
- Be efficient - don't repeat actions that already succeeded
- If you have enough information, summarize and finish
"""

    REFLECTION_PROMPT = """Reflect on the research workflow execution.

Task: {task}
Steps taken: {num_steps}
Actions: {actions_list}

Evaluation:
1. Did we achieve the task goal?
2. Were the steps efficient?
3. What could be improved?

Provide a brief reflection (2-3 sentences) and a completion status.

JSON format:
{{
    "task_completed": true/false,
    "reflection": "Your reflection here",
    "quality_score": 1-10,
    "suggestions": "Suggestions for improvement"
}}
"""
    
    def __init__(
        self,
        tools: List[BaseTool],
        model: Optional[str] = None,
        temperature: float = 0.5,  # Balanced for reasoning
        enable_reflection: bool = True
    ):
        """
        Initialize advanced planner agent.
        
        Args:
            tools: List of available tools
            model: LLM model name
            temperature: LLM temperature
            enable_reflection: Whether to enable self-reflection
        """
        super().__init__(
            name="advanced_planner_agent",
            description="Advanced orchestration with multi-step reasoning and reflection"
        )
        
        self.tools = {tool.name: tool for tool in tools}
        self.llm = create_llm(
            model=model,
            temperature=temperature
        )
        self.enable_reflection = enable_reflection
        
        self.planning_prompt = ChatPromptTemplate.from_template(self.PLANNING_PROMPT)
        self.reflection_prompt = ChatPromptTemplate.from_template(self.REFLECTION_PROMPT)
    
    async def process(self, state: AgentState) -> AgentState:
        """
        Process with advanced planning and reasoning.
        
        Args:
            state: Current agent state
            
        Returns:
            Updated agent state with decision
        """
        # Check if should continue
        if not self._should_continue(state):
            # Run reflection if enabled
            if self.enable_reflection and not state.error:
                reflection = await self._reflect(state)
                state.metadata["reflection"] = reflection
            return state
        
        # Get task and context
        task = state.metadata.get("task", "No task specified")
        
        # Build context summaries
        steps_summary = self._summarize_steps(state.messages)
        results_summary = self._summarize_results(state.messages)
        tool_descriptions = self._format_tool_descriptions()
        
        try:
            # Generate plan with reasoning
            prompt = self.planning_prompt.format(
                tool_descriptions=tool_descriptions,
                task=task,
                current_step=state.current_step + 1,
                max_steps=state.max_steps,
                steps_summary=steps_summary,
                results_summary=results_summary
            )
            
            response = await self.llm.ainvoke(prompt)
            decision = self._parse_decision(response.content)
            
            # Store reasoning in metadata
            if "reasoning_history" not in state.metadata:
                state.metadata["reasoning_history"] = []
            state.metadata["reasoning_history"].append(decision)
            
            # Execute decision
            if decision.get("is_complete") or decision["next_action"] == "finish":
                state.final_output = self._create_final_output(state, decision)
            
            elif decision["next_action"] in self.tools:
                # Execute tool
                tool = self.tools[decision["next_action"]]
                result = await self._execute_with_fallback(
                    tool=tool,
                    params=decision.get("parameters", {}),
                    fallback_action=decision.get("fallback_action")
                )
                
                # Add to messages with enhanced info
                state.messages.append({
                    "step": state.current_step + 1,
                    "action": decision["next_action"],
                    "reasoning": decision.get("reasoning", ""),
                    "analysis": decision.get("analysis", ""),
                    "expected_outcome": decision.get("expected_outcome", ""),
                    "result": result.model_dump() if hasattr(result, 'model_dump') else result,
                    "success": result.success if hasattr(result, 'success') else True
                })
            
            else:
                state.error = f"Unknown action: {decision['next_action']}"
            
            # Increment step
            state.current_step += 1
            
        except Exception as e:
            state.error = f"Error in advanced planner: {str(e)}"
        
        return state
    
    async def _execute_with_fallback(
        self,
        tool: BaseTool,
        params: Dict[str, Any],
        fallback_action: Optional[str] = None
    ) -> Any:
        """
        Execute tool with fallback on failure.
        
        Args:
            tool: Tool to execute
            params: Tool parameters
            fallback_action: Alternative action if primary fails
            
        Returns:
            Tool result
        """
        try:
            result = await tool.execute(**params)
            
            # If failed and fallback available, try fallback
            if hasattr(result, 'success') and not result.success and fallback_action:
                if fallback_action in self.tools:
                    fallback_tool = self.tools[fallback_action]
                    result = await fallback_tool.execute(**params)
            
            return result
            
        except Exception as e:
            # Create error result
            return type('obj', (object,), {
                'success': False,
                'error': str(e),
                'model_dump': lambda: {'success': False, 'error': str(e)}
            })()
    
    async def _reflect(self, state: AgentState) -> Dict[str, Any]:
        """
        Perform reflection on completed workflow.
        
        Args:
            state: Final agent state
            
        Returns:
            Reflection dictionary
        """
        task = state.metadata.get("task", "Unknown task")
        actions_list = [msg.get("action", "unknown") for msg in state.messages]
        
        try:
            prompt = self.reflection_prompt.format(
                task=task,
                num_steps=state.current_step,
                actions_list=", ".join(actions_list)
            )
            
            response = await self.llm.ainvoke(prompt)
            reflection = self._parse_json(response.content)
            
            return reflection
            
        except Exception as e:
            return {
                "task_completed": bool(state.final_output),
                "reflection": f"Error during reflection: {str(e)}",
                "quality_score": 5,
                "suggestions": "N/A"
            }
    
    def _summarize_steps(self, messages: List[Dict[str, Any]]) -> str:
        """Create concise summary of steps taken."""
        if not messages:
            return "No steps taken yet"
        
        summary = []
        for msg in messages:
            action = msg.get("action", "unknown")
            success = msg.get("success", True)
            status = "✓" if success else "✗"
            summary.append(f"{status} Step {msg.get('step')}: {action}")
        
        return "\n".join(summary)
    
    def _summarize_results(self, messages: List[Dict[str, Any]]) -> str:
        """Create concise summary of results obtained."""
        if not messages:
            return "No results yet"
        
        summaries = []
        for msg in messages:
            result = msg.get("result", {})
            
            # Extract key info from result
            if isinstance(result, dict):
                if result.get("success"):
                    data = result.get("data", {})
                    if isinstance(data, list):
                        summaries.append(f"- Obtained {len(data)} items")
                    elif isinstance(data, dict):
                        summaries.append(f"- Obtained: {list(data.keys())[:3]}")
                else:
                    summaries.append(f"- Failed: {result.get('error', 'Unknown error')}")
        
        return "\n".join(summaries) if summaries else "No detailed results"
    
    def _format_tool_descriptions(self) -> str:
        """Format tool descriptions for prompt."""
        return "\n".join([
            f"- {name}: {tool.description}"
            for name, tool in self.tools.items()
        ])
    
    def _create_final_output(
        self,
        state: AgentState,
        decision: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create structured final output.
        
        Args:
            state: Current state
            decision: Final decision
            
        Returns:
            Final output dictionary
        """
        return {
            "summary": decision.get("analysis", "Task completed"),
            "total_steps": state.current_step,
            "actions_taken": [msg.get("action") for msg in state.messages],
            "messages": state.messages,
            "reasoning": decision.get("reasoning", ""),
            "task": state.metadata.get("task", "")
        }
    
    def _parse_decision(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured decision.
        
        Args:
            response: LLM response text
            
        Returns:
            Structured decision dictionary
        """
        parsed = self._parse_json(response)
        
        # Ensure required fields
        if not parsed or "next_action" not in parsed:
            return {
                "analysis": "Could not parse response",
                "is_complete": False,
                "next_action": "finish",
                "reasoning": "Parsing failed",
                "parameters": {},
                "fallback_action": None,
                "expected_outcome": "Unknown"
            }
        
        return parsed
    
    def _parse_json(self, response: str) -> Dict[str, Any]:
        """
        Extract and parse JSON from response.
        
        Args:
            response: Response text
            
        Returns:
            Parsed JSON dictionary
        """
        import re
        
        try:
            # Try direct parse
            return json.loads(response)
        except:
            pass
        
        try:
            # Try to extract JSON block
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass
        
        return {}