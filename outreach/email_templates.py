"""
Email template manager for researcher outreach.
Generates personalized emails using LLM with paper context.
"""
from typing import Dict, Any, Optional
from agents.llm_factory import create_llm
from enum import Enum


class EmailType(str, Enum):
    """Types of outreach emails."""
    COLLABORATION = "collaboration"
    QUESTION = "question"
    FEEDBACK = "feedback"
    INTERVIEW = "interview"
    FOLLOWUP = "followup"


class EmailTemplateManager:
    """
    Manages email template generation for researcher outreach.
    
    Features:
    - Personalized email generation
    - Context-aware content (paper-specific)
    - Multiple email types
    - Tone customization
    """
    
    def __init__(self):
        """Initialize template manager with LLM."""
        self.llm = create_llm(temperature=0.7)
    
    async def generate_email(
        self,
        email_type: EmailType,
        recipient_name: str,
        recipient_papers: list[Dict[str, Any]],
        sender_name: str,
        sender_affiliation: str,
        context: Optional[Dict[str, Any]] = None,
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """
        Generate personalized outreach email.
        
        Args:
            email_type: Type of outreach email
            recipient_name: Recipient researcher's name
            recipient_papers: List of recipient's papers
            sender_name: Sender's name
            sender_affiliation: Sender's institution/organization
            context: Additional context (research interests, questions, etc.)
            tone: Email tone (professional, friendly, formal)
            
        Returns:
            Dict with subject, body, and metadata
        """
        # Select appropriate prompt
        prompt = self._build_prompt(
            email_type=email_type,
            recipient_name=recipient_name,
            recipient_papers=recipient_papers,
            sender_name=sender_name,
            sender_affiliation=sender_affiliation,
            context=context,
            tone=tone
        )
        
        # Generate email
        response = await self.llm.ainvoke(prompt)
        
        # Parse response
        email_content = self._parse_email_response(self._extract_text(response.content))
        
        return {
            "subject": email_content["subject"],
            "body": email_content["body"],
            "email_type": email_type,
            "recipient": recipient_name,
            "metadata": {
                "papers_referenced": len(recipient_papers),
                "tone": tone,
                "generated": True
            }
        }
    
    def _build_prompt(
        self,
        email_type: EmailType,
        recipient_name: str,
        recipient_papers: list[Dict[str, Any]],
        sender_name: str,
        sender_affiliation: str,
        context: Optional[Dict[str, Any]],
        tone: str
    ) -> str:
        """Build prompt for email generation."""
        
        # Format paper information
        papers_text = self._format_papers(recipient_papers)
        
        # Base prompt based on email type
        if email_type == EmailType.COLLABORATION:
            base_prompt = self._collaboration_prompt()
        elif email_type == EmailType.QUESTION:
            base_prompt = self._question_prompt()
        elif email_type == EmailType.FEEDBACK:
            base_prompt = self._feedback_prompt()
        elif email_type == EmailType.INTERVIEW:
            base_prompt = self._interview_prompt()
        else:  # FOLLOWUP
            base_prompt = self._followup_prompt()
        
        # Build full prompt
        prompt = f"""You are writing a {tone} outreach email to a researcher.

**Recipient Information:**
Name: {recipient_name}
Recent Papers:
{papers_text}

**Sender Information:**
Name: {sender_name}
Affiliation: {sender_affiliation}

**Context:**
{context.get('purpose', 'General outreach') if context else 'General outreach'}
{f"Specific Interest: {context.get('specific_interest', '')}" if context and context.get('specific_interest') else ""}
{f"Questions: {context.get('questions', '')}" if context and context.get('questions') else ""}

**Email Type:** {email_type}

{base_prompt}

**Important:**
- Reference specific papers naturally
- Be concise (under 200 words)
- Include clear call-to-action
- Maintain {tone} tone
- Do NOT use generic templates

**Output Format:**
SUBJECT: [subject line]

BODY:
[email body]
"""
        return prompt
    
    def _collaboration_prompt(self) -> str:
        return """Write a collaboration proposal email that:
- Highlights overlap in research interests
- References 1-2 specific papers
- Proposes a concrete collaboration idea
- Suggests next steps"""
    
    def _question_prompt(self) -> str:
        return """Write a research question email that:
- Shows understanding of their work
- Asks 1-2 specific, thoughtful questions
- Explains why you're asking
- Keeps it brief"""
    
    def _feedback_prompt(self) -> str:
        return """Write a feedback request email that:
- Explains your research briefly
- Shows why their expertise is relevant
- Asks for specific feedback
- Respects their time"""
    
    def _interview_prompt(self) -> str:
        return """Write an interview request email that:
- Explains the purpose/project
- References their expertise
- Suggests time commitment
- Offers flexibility"""
    
    def _followup_prompt(self) -> str:
        return """Write a polite follow-up email that:
- References previous email
- Adds new context or value
- Reiterates interest
- Keeps it short"""
    
    def _format_papers(self, papers: list[Dict[str, Any]]) -> str:
        """Format papers for prompt."""
        if not papers:
            return "No papers available"
        
        formatted = []
        for i, paper in enumerate(papers[:3], 1):  # Top 3 papers
            title = paper.get("title", "Unknown")
            year = paper.get("year", "N/A")
            abstract = paper.get("abstract", "")[:150]
            formatted.append(f"{i}. {title} ({year})\n   Abstract: {abstract}...")
        
        return "\n".join(formatted)
    
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

    def _parse_email_response(self, content: str) -> Dict[str, str]:
        """Parse LLM response into subject and body."""
        lines = content.strip().split("\n")
        
        subject = ""
        body_lines = []
        in_body = False
        
        for line in lines:
            if line.startswith("SUBJECT:"):
                subject = line.replace("SUBJECT:", "").strip()
            elif line.startswith("BODY:"):
                in_body = True
            elif in_body:
                body_lines.append(line)
        
        body = "\n".join(body_lines).strip()
        
        # Fallback if parsing fails
        if not subject or not body:
            subject = "Research Collaboration Inquiry"
            body = content
        
        return {"subject": subject, "body": body}


# Pre-defined quick templates for common scenarios
QUICK_TEMPLATES = {
    "cold_intro": {
        "subject": "Research Inquiry - {paper_title}",
        "body": """Dear {recipient_name},

I recently read your paper "{paper_title}" and found your work on {topic} fascinating. 

{specific_interest}

I would love to discuss this further or explore potential collaboration opportunities.

Best regards,
{sender_name}
{sender_affiliation}"""
    },
    
    "quick_question": {
        "subject": "Quick Question About {paper_title}",
        "body": """Hi {recipient_name},

I have a quick question about your paper "{paper_title}":

{question}

Thanks for your time!

{sender_name}"""
    },
    
    "conference_meetup": {
        "subject": "Meeting at {conference_name}",
        "body": """Dear {recipient_name},

I'll be attending {conference_name} and would love to connect in person to discuss your recent work on {topic}.

Are you available for coffee during the conference?

Best,
{sender_name}"""
    }
}