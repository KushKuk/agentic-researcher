"""Outreach automation module for researcher communication."""
from outreach.email_templates import EmailTemplateManager, EmailType, QUICK_TEMPLATES
from outreach.contact_finder import ContactFinder, EmailValidator
from outreach.campaign_manager import OutreachCampaign

__all__ = [
    "EmailTemplateManager",
    "EmailType",
    "QUICK_TEMPLATES",
    "ContactFinder",
    "EmailValidator",
    "OutreachCampaign",
]