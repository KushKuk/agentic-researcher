"""
Outreach campaign manager for batch email generation and tracking.
Manages multi-researcher outreach campaigns.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from pathlib import Path
from outreach.email_templates import EmailTemplateManager, EmailType
from outreach.contact_finder import ContactFinder


class OutreachCampaign:
    """
    Manages an outreach campaign to multiple researchers.
    
    Features:
    - Batch email generation
    - Campaign tracking
    - Personalization at scale
    - Export to CSV/JSON
    """
    
    def __init__(
        self,
        campaign_name: str,
        campaign_purpose: str,
        sender_info: Dict[str, str]
    ):
        """
        Initialize outreach campaign.
        
        Args:
            campaign_name: Name of the campaign
            campaign_purpose: Purpose/goal of outreach
            sender_info: Dict with name, affiliation, etc.
        """
        self.campaign_name = campaign_name
        self.campaign_purpose = campaign_purpose
        self.sender_info = sender_info
        self.created_at = datetime.now().isoformat()
        
        self.template_manager = EmailTemplateManager()
        self.contact_finder = ContactFinder()
        
        self.outreach_list: List[Dict[str, Any]] = []
    
    async def add_recipients_from_papers(
        self,
        papers: List[Dict[str, Any]],
        email_type: EmailType = EmailType.COLLABORATION,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Add recipients from a list of papers.
        
        Args:
            papers: List of papers with author information
            email_type: Type of outreach email
            filter_criteria: Optional criteria (min citations, year range, etc.)
            
        Returns:
            Number of recipients added
        """
        added_count = 0
        
        for paper in papers:
            # Apply filters
            if filter_criteria:
                if not self._meets_criteria(paper, filter_criteria):
                    continue
            
            # Extract authors
            authors = paper.get("authors", [])
            
            for author in authors:
                author_name = author if isinstance(author, str) else author.get("name", "")
                
                if not author_name:
                    continue
                
                # Check if already in list
                if self._already_added(author_name):
                    continue
                
                # Find contact info
                contact = await self.contact_finder.find_author_contact(
                    author_name=author_name,
                    paper_id=paper.get("paper_id")
                )
                
                # Generate personalized email
                email = await self.template_manager.generate_email(
                    email_type=email_type,
                    recipient_name=author_name,
                    recipient_papers=[paper],
                    sender_name=self.sender_info["name"],
                    sender_affiliation=self.sender_info["affiliation"],
                    context={"purpose": self.campaign_purpose},
                    tone=self.sender_info.get("tone", "professional")
                )
                
                # Add to outreach list
                self.outreach_list.append({
                    "recipient_name": author_name,
                    "email": contact.get("email"),
                    "affiliation": contact.get("affiliations", []),
                    "paper_title": paper.get("title"),
                    "paper_id": paper.get("paper_id"),
                    "email_subject": email["subject"],
                    "email_body": email["body"],
                    "email_type": email_type,
                    "status": "pending",
                    "generated_at": datetime.now().isoformat()
                })
                
                added_count += 1
        
        return added_count
    
    async def add_recipient(
        self,
        name: str,
        email: Optional[str],
        papers: List[Dict[str, Any]],
        email_type: EmailType = EmailType.COLLABORATION,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Add a single recipient to the campaign.
        
        Args:
            name: Recipient name
            email: Email address (optional)
            papers: Recipient's papers for context
            email_type: Type of outreach
            context: Additional context for email generation
        """
        # Generate email
        email_content = await self.template_manager.generate_email(
            email_type=email_type,
            recipient_name=name,
            recipient_papers=papers,
            sender_name=self.sender_info["name"],
            sender_affiliation=self.sender_info["affiliation"],
            context=context or {"purpose": self.campaign_purpose},
            tone=self.sender_info.get("tone", "professional")
        )
        
        self.outreach_list.append({
            "recipient_name": name,
            "email": email,
            "papers_count": len(papers),
            "email_subject": email_content["subject"],
            "email_body": email_content["body"],
            "email_type": email_type,
            "status": "pending",
            "generated_at": datetime.now().isoformat()
        })
    
    def get_campaign_summary(self) -> Dict[str, Any]:
        """
        Get campaign statistics and summary.
        
        Returns:
            Summary dict with stats
        """
        total = len(self.outreach_list)
        with_email = sum(1 for r in self.outreach_list if r.get("email"))
        
        status_counts = {}
        for recipient in self.outreach_list:
            status = recipient.get("status", "pending")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "campaign_name": self.campaign_name,
            "campaign_purpose": self.campaign_purpose,
            "created_at": self.created_at,
            "total_recipients": total,
            "recipients_with_email": with_email,
            "coverage": with_email / total if total > 0 else 0,
            "status_breakdown": status_counts
        }
    
    def export_to_csv(self, output_path: str) -> str:
        """
        Export outreach list to CSV.
        
        Args:
            output_path: Path for CSV file
            
        Returns:
            Path to created file
        """
        import csv
        
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', newline='', encoding='utf-8') as f:
            if not self.outreach_list:
                return str(path)
            
            fieldnames = ["recipient_name", "email", "email_subject", 
                         "email_body", "status", "generated_at"]
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            
            writer.writeheader()
            writer.writerows(self.outreach_list)
        
        return str(path)
    
    def export_to_json(self, output_path: str) -> str:
        """
        Export campaign to JSON.
        
        Args:
            output_path: Path for JSON file
            
        Returns:
            Path to created file
        """
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        data = {
            "campaign": {
                "name": self.campaign_name,
                "purpose": self.campaign_purpose,
                "created_at": self.created_at,
                "sender": self.sender_info
            },
            "recipients": self.outreach_list,
            "summary": self.get_campaign_summary()
        }
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return str(path)
    
    def _meets_criteria(
        self,
        paper: Dict[str, Any],
        criteria: Dict[str, Any]
    ) -> bool:
        """Check if paper meets filter criteria."""
        # Min citations
        if "min_citations" in criteria:
            if paper.get("citation_count", 0) < criteria["min_citations"]:
                return False
        
        # Year range
        if "min_year" in criteria:
            if paper.get("year", 0) < criteria["min_year"]:
                return False
        
        if "max_year" in criteria:
            if paper.get("year", 9999) > criteria["max_year"]:
                return False
        
        return True
    
    def _already_added(self, author_name: str) -> bool:
        """Check if author already in outreach list."""
        return any(
            r["recipient_name"].lower() == author_name.lower()
            for r in self.outreach_list
        )