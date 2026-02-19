"""
LLM factory for creating Gemini language model instances.
"""
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from config.config_settings import settings


def create_llm(
    model: Optional[str] = None,
    temperature: float = 0.7
) -> ChatGoogleGenerativeAI:
    """
    Create a Gemini LLM instance.
    
    Args:
        model: Model name (defaults to settings.default_model)
        temperature: Model temperature
        
    Returns:
        ChatGoogleGenerativeAI instance
    """
    model = model or settings.default_model
    
    return ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        api_key=settings.google_api_key,  # type: ignore[arg-type]
        convert_system_message_to_human=True
    )


# Alias for backward compatibility
create_gemini_llm = create_llm