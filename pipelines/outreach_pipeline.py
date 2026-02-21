"""
Outreach automation pipeline - Phase 6.
Automates researcher outreach based on paper discovery.
"""
from typing import Dict, Any, List, Optional
import time
from outreach import OutreachCampaign, EmailType, ContactFinder
from tools.semantic_scholar_tool import SemanticScholarTool
from config.settings import settings


class OutreachPipeline:
    """
    Automated outreach pipeline.
    
    Workflow:
    1. Search for papers on a topic
    2. Extract author contacts
    3. Generate personalized emails
    4. Create outreach campaign
    5. Export for sending
    """
    
    def __init__(
        self,
        sender_name: str,
        sender_affiliation: str,
        sender_tone: str = "professional"
    ):
        """
        Initialize outreach pipeline.
        
        Args:
            sender_name: Your name
            sender_affiliation: Your institution/organization
            sender_tone: Email tone (professional, friendly, formal)
        """
        self.sender_info = {
            "name": sender_name,
            "affiliation": sender_affiliation,
            "tone": sender_tone
        }
        
        self.semantic_scholar = SemanticScholarTool(
            api_key=settings.semantic_scholar_api_key
        )
        self.contact_finder = ContactFinder()
    
    async def create_campaign_from_query(
        self,
        campaign_name: str,
        query: str,
        num_papers: int = 20,
        email_type: EmailType = EmailType.COLLABORATION,
        purpose: Optional[str] = None,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create outreach campaign from search query.
        
        Args:
            campaign_name: Name for the campaign
            query: Search query for papers
            num_papers: Number of papers to search
            email_type: Type of outreach email
            purpose: Campaign purpose/goal
            filter_criteria: Paper filters (min_citations, year_range, etc.)
            
        Returns:
            Campaign summary and export paths
        """
        start_time = time.time()
        
        # Step 1: Search for papers
        search_result = await self.semantic_scholar.execute(
            query=query,
            limit=num_papers
        )
        
        if not search_result.success:
            return {
                "success": False,
                "error": search_result.error
            }
        
        papers = search_result.data
        
        # Step 2: Create campaign
        campaign = OutreachCampaign(
            campaign_name=campaign_name,
            campaign_purpose=purpose or f"Research collaboration on: {query}",
            sender_info=self.sender_info
        )
        
        # Step 3: Add recipients from papers
        recipients_added = await campaign.add_recipients_from_papers(
            papers=papers,
            email_type=email_type,
            filter_criteria=filter_criteria
        )
        
        # Step 4: Get summary
        summary = campaign.get_campaign_summary()
        
        # Step 5: Export files
        csv_path = campaign.export_to_csv(f"./data/outreach/{campaign_name}.csv")
        json_path = campaign.export_to_json(f"./data/outreach/{campaign_name}.json")
        
        execution_time = time.time() - start_time
        
        return {
            "success": True,
            "campaign_name": campaign_name,
            "query": query,
            "papers_found": len(papers),
            "recipients_added": recipients_added,
            "summary": summary,
            "exports": {
                "csv": csv_path,
                "json": json_path
            },
            "execution_time_seconds": execution_time
        }
    
    async def create_targeted_campaign(
        self,
        campaign_name: str,
        target_authors: List[str],
        email_type: EmailType = EmailType.COLLABORATION,
        purpose: Optional[str] = None,
        context_per_author: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Create campaign targeting specific authors.
        
        Args:
            campaign_name: Name for the campaign
            target_authors: List of author names
            email_type: Type of outreach email
            purpose: Campaign purpose
            context_per_author: Optional context dict for each author
            
        Returns:
            Campaign summary
        """
        start_time = time.time()
        
        # Create campaign
        campaign = OutreachCampaign(
            campaign_name=campaign_name,
            campaign_purpose=purpose or "Targeted researcher outreach",
            sender_info=self.sender_info
        )
        
        # Process each author
        for author_name in target_authors:
            # Find author's papers
            search_result = await self.semantic_scholar.execute(
                query=f"author:{author_name}",
                limit=5
            )
            
            if not search_result.success:
                continue
            
            papers = search_result.data
            
            # Find contact
            contact = await self.contact_finder.find_author_contact(author_name)
            
            # Get author-specific context
            context = None
            if context_per_author and author_name in context_per_author:
                context = context_per_author[author_name]
            
            # Add to campaign
            await campaign.add_recipient(
                name=author_name,
                email=contact.get("email"),
                papers=papers,
                email_type=email_type,
                context=context
            )
        
        # Export
        csv_path = campaign.export_to_csv(f"./data/outreach/{campaign_name}.csv")
        json_path = campaign.export_to_json(f"./data/outreach/{campaign_name}.json")
        
        execution_time = time.time() - start_time
        
        return {
            "success": True,
            "campaign_name": campaign_name,
            "recipients_processed": len(target_authors),
            "summary": campaign.get_campaign_summary(),
            "exports": {
                "csv": csv_path,
                "json": json_path
            },
            "execution_time_seconds": execution_time
        }
    
    async def generate_single_email(
        self,
        recipient_name: str,
        recipient_papers: List[Dict[str, Any]],
        email_type: EmailType = EmailType.COLLABORATION,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a single personalized email.
        
        Args:
            recipient_name: Recipient's name
            recipient_papers: Recipient's papers for context
            email_type: Type of email
            context: Additional context
            
        Returns:
            Generated email
        """
        from outreach.email_templates import EmailTemplateManager
        
        template_manager = EmailTemplateManager()
        
        email = await template_manager.generate_email(
            email_type=email_type,
            recipient_name=recipient_name,
            recipient_papers=recipient_papers,
            sender_name=self.sender_info["name"],
            sender_affiliation=self.sender_info["affiliation"],
            context=context,
            tone=self.sender_info["tone"]
        )
        
        # Find contact
        contact = await self.contact_finder.find_author_contact(recipient_name)
        
        return {
            "success": True,
            "recipient": recipient_name,
            "email": contact.get("email"),
            "subject": email["subject"],
            "body": email["body"],
            "confidence": contact.get("confidence", "low")
        }