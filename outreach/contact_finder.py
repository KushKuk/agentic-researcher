"""
Contact finder for extracting researcher contact information.
Finds emails, affiliations, and social profiles from papers and external sources.
"""
from typing import Dict, Any, Optional, List
import re
from tools.semantic_scholar_tool import SemanticScholarTool


class ContactFinder:
    """
    Finds contact information for researchers.
    
    Sources:
    - Paper metadata (Semantic Scholar)
    - Author affiliations
    - Pattern matching for emails
    """
    
    def __init__(self):
        """Initialize contact finder."""
        self.semantic_scholar = SemanticScholarTool()
        self.email_pattern = re.compile(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        )
    
    async def find_author_contact(
        self,
        author_name: str,
        paper_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Find contact information for an author.
        
        Args:
            author_name: Author's name
            paper_id: Optional paper ID for context
            
        Returns:
            Contact information dict
        """
        result = {
            "name": author_name,
            "email": None,
            "affiliations": [],
            "papers": [],
            "confidence": "low"
        }
        
        # Search for author's papers
        try:
            search_result = await self.semantic_scholar.execute(
                query=f"author:{author_name}",
                limit=5
            )
            
            if search_result.success:
                papers = search_result.data
                result["papers"] = papers
                
                # Extract affiliations from papers
                affiliations = set()
                for paper in papers:
                    authors = paper.get("authors", [])
                    for author in authors:
                        if self._name_matches(author, author_name):
                            # Affiliations would come from detailed paper data
                            pass
                
                # Try to infer email from affiliation
                if affiliations:
                    result["affiliations"] = list(affiliations)
                    result["email"] = self._infer_email(author_name, list(affiliations)[0])
                    result["confidence"] = "medium"
        
        except Exception:
            pass
        
        return result
    
    async def find_contacts_for_paper(
        self,
        paper: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Find contact information for all authors of a paper.
        
        Args:
            paper: Paper metadata dict
            
        Returns:
            List of contact dicts for each author
        """
        authors = paper.get("authors", [])
        paper_id = paper.get("paper_id", "")
        
        contacts = []
        for author in authors:
            author_name = author if isinstance(author, str) else author.get("name", "")
            
            if author_name:
                contact = await self.find_author_contact(author_name, paper_id)
                contacts.append(contact)
        
        return contacts
    
    def extract_emails_from_text(self, text: str) -> List[str]:
        """
        Extract email addresses from text.
        
        Args:
            text: Text to search
            
        Returns:
            List of email addresses found
        """
        return self.email_pattern.findall(text)
    
    def _name_matches(self, author_obj: Any, target_name: str) -> bool:
        """Check if author object matches target name."""
        if isinstance(author_obj, str):
            return author_obj.lower() == target_name.lower()
        elif isinstance(author_obj, dict):
            name = author_obj.get("name", "")
            return name.lower() == target_name.lower()
        return False
    
    def _infer_email(self, name: str, affiliation: str) -> Optional[str]:
        """
        Infer possible email from name and affiliation.
        
        Args:
            name: Author name
            affiliation: Institution/affiliation
            
        Returns:
            Inferred email (best guess) or None
        """
        # Extract domain from common institutions
        domain_map = {
            "stanford": "stanford.edu",
            "mit": "mit.edu",
            "berkeley": "berkeley.edu",
            "harvard": "harvard.edu",
            "google": "google.com",
            "microsoft": "microsoft.com",
            "openai": "openai.com",
            "anthropic": "anthropic.com"
        }
        
        affiliation_lower = affiliation.lower()
        domain = None
        
        for key, value in domain_map.items():
            if key in affiliation_lower:
                domain = value
                break
        
        if not domain:
            return None
        
        # Format name as email username
        parts = name.lower().split()
        if len(parts) >= 2:
            # firstname.lastname format
            username = f"{parts[0]}.{parts[-1]}"
        else:
            username = parts[0]
        
        return f"{username}@{domain}"


class EmailValidator:
    """Validates email addresses."""
    
    @staticmethod
    def is_valid_format(email: str) -> bool:
        """Check if email has valid format."""
        pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        return bool(pattern.match(email))
    
    @staticmethod
    def is_academic_email(email: str) -> bool:
        """Check if email is from academic institution."""
        academic_domains = ['.edu', '.ac.uk', '.edu.au', '.ac.jp']
        return any(email.endswith(domain) for domain in academic_domains)
    
    @staticmethod
    def clean_email(email: str) -> str:
        """Clean and normalize email address."""
        return email.strip().lower()