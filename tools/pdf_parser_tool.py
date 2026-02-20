"""
PDF parser tool for extracting text and metadata from PDF files.
Uses PyPDF for text extraction.
"""
from pathlib import Path
from typing import Dict, Any, List, Optional
from pypdf import PdfReader
from tools.base_tool import BaseTool, ToolResult


class PDFParserTool(BaseTool):
    """Tool for parsing PDF files and extracting content."""
    
    @property
    def name(self) -> str:
        return "pdf_parser"
    
    @property
    def description(self) -> str:
        return (
            "Parse PDF files and extract text content, metadata, and structure. "
            "Accepts a file path and returns extracted text, page count, and metadata."
        )
    
    async def execute(self, **kwargs) -> ToolResult:
        """
        Parse a PDF file and extract content.
        
        Args (from kwargs):
            file_path: Path to the PDF file
            extract_pages: Optional list of specific page numbers to extract (0-indexed)
            max_pages: Optional maximum number of pages to extract
            
        Returns:
            ToolResult with extracted content and metadata
        """
        # Extract parameters from kwargs
        file_path: str = kwargs.get("file_path", "")
        extract_pages: Optional[List[int]] = kwargs.get("extract_pages")
        max_pages: Optional[int] = kwargs.get("max_pages")
        
        if not file_path:
            return self._error("file_path parameter is required")
        
        path = Path(file_path)
        if not path.exists():
            return self._error(f"File not found: {file_path}")
        
        if not path.suffix.lower() == '.pdf':
            return self._error(f"File is not a PDF: {file_path}")
        
        try:
            # Open and read PDF
            reader = PdfReader(str(path))
            
            # Extract metadata
            metadata = self._extract_metadata(reader)
            
            # Extract text from pages
            num_pages = len(reader.pages)
            
            # Determine which pages to extract
            if extract_pages:
                pages_to_extract = [p for p in extract_pages if 0 <= p < num_pages]
            elif max_pages:
                pages_to_extract = list(range(min(max_pages, num_pages)))
            else:
                pages_to_extract = list(range(num_pages))
            
            # Extract text
            pages_content = []
            full_text = []
            
            for page_num in pages_to_extract:
                page = reader.pages[page_num]
                text = page.extract_text()
                
                pages_content.append({
                    "page_number": page_num + 1,  # 1-indexed for user
                    "text": text,
                    "char_count": len(text)
                })
                full_text.append(text)
            
            combined_text = "\n\n".join(full_text)
            
            return self._success(
                data={
                    "file_path": str(path),
                    "num_pages": num_pages,
                    "pages_extracted": len(pages_content),
                    "metadata": metadata,
                    "full_text": combined_text,
                    "pages": pages_content,
                    "total_chars": len(combined_text),
                    "total_words": len(combined_text.split())
                },
                metadata={
                    "parser": "pypdf",
                    "extracted_pages": pages_to_extract
                }
            )
            
        except Exception as e:
            return self._error(f"Error parsing PDF: {str(e)}")
    
    def _extract_metadata(self, reader: PdfReader) -> Dict[str, Any]:
        """
        Extract metadata from PDF.
        
        Args:
            reader: PdfReader instance
            
        Returns:
            Dictionary of metadata
        """
        metadata = {}
        
        try:
            if reader.metadata:
                meta = reader.metadata
                metadata = {
                    "title": meta.get('/Title', ''),
                    "author": meta.get('/Author', ''),
                    "subject": meta.get('/Subject', ''),
                    "creator": meta.get('/Creator', ''),
                    "producer": meta.get('/Producer', ''),
                    "creation_date": str(meta.get('/CreationDate', '')),
                    "modification_date": str(meta.get('/ModDate', ''))
                }
        except Exception:
            pass
        
        return metadata
    
    async def extract_section(
        self,
        file_path: str,
        start_page: int,
        end_page: int
    ) -> ToolResult:
        """
        Extract text from a specific section of pages.
        
        Args:
            file_path: Path to PDF file
            start_page: Starting page number (1-indexed)
            end_page: Ending page number (1-indexed, inclusive)
            
        Returns:
            ToolResult with extracted section
        """
        # Convert to 0-indexed
        pages = list(range(start_page - 1, end_page))
        return await self.execute(file_path=file_path, extract_pages=pages)
    
    async def get_page_count(self, file_path: str) -> ToolResult:
        """
        Get the number of pages in a PDF.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            ToolResult with page count
        """
        path = Path(file_path)
        if not path.exists():
            return self._error(f"File not found: {file_path}")
        
        try:
            reader = PdfReader(str(path))
            return self._success(
                data={"page_count": len(reader.pages)},
                metadata={"file_path": str(path)}
            )
        except Exception as e:
            return self._error(f"Error reading PDF: {str(e)}")