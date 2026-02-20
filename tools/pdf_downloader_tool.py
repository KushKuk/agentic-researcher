"""
PDF downloader tool for fetching academic papers.
Downloads PDFs from URLs and saves them locally.
"""
import httpx
import aiofiles
from pathlib import Path
from typing import Optional
from tools.base_tool import BaseTool, ToolResult


class PDFDownloaderTool(BaseTool):
    """Tool for downloading PDF files from URLs."""
    
    def __init__(self, download_dir: str = "./data/pdfs"):
        """
        Initialize PDF downloader.
        
        Args:
            download_dir: Directory to save downloaded PDFs
        """
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)
    
    @property
    def name(self) -> str:
        return "pdf_downloader"
    
    @property
    def description(self) -> str:
        return (
            "Download PDF files from URLs. Accepts a URL and optional filename, "
            "downloads the PDF, and returns the local file path."
        )
    
    async def execute(self, **kwargs) -> ToolResult:
        """Execute PDF download with given parameters."""
        url: str = kwargs.get("url", "")
        filename: Optional[str] = kwargs.get("filename")
        timeout: float = kwargs.get("timeout", 60.0)
        """
        Download a PDF from URL.
        
        Args:
            url: URL of the PDF to download
            filename: Optional filename (auto-generated if not provided)
            timeout: Request timeout in seconds
            
        Returns:
            ToolResult with file path
        """
        if not url:
            return self._error("URL parameter is required")
        
        # Generate filename if not provided
        if not filename:
            filename = self._generate_filename(url)
        
        # Ensure .pdf extension
        if not filename.endswith('.pdf'):
            filename += '.pdf'
        
        file_path = self.download_dir / filename
        
        try:
            # Download the file
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Check if it's actually a PDF
                content_type = response.headers.get('content-type', '').lower()
                if 'pdf' not in content_type and not url.endswith('.pdf'):
                    # Try anyway, some servers don't set correct content-type
                    pass
                
                # Save to file
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(response.content)
                
                file_size = len(response.content)
                
                return self._success(
                    data={
                        "file_path": str(file_path),
                        "filename": filename,
                        "size_bytes": file_size,
                        "url": url
                    },
                    metadata={
                        "download_dir": str(self.download_dir),
                        "content_type": content_type
                    }
                )
                
        except httpx.HTTPStatusError as e:
            return self._error(f"HTTP error downloading PDF: {e.response.status_code}")
        except httpx.RequestError as e:
            return self._error(f"Request error: {str(e)}")
        except Exception as e:
            return self._error(f"Error downloading PDF: {str(e)}")
    
    def _generate_filename(self, url: str) -> str:
        """
        Generate a filename from URL.
        
        Args:
            url: Source URL
            
        Returns:
            Generated filename
        """
        import hashlib
        from urllib.parse import urlparse
        
        # Try to extract filename from URL
        parsed = urlparse(url)
        path_parts = parsed.path.split('/')
        
        for part in reversed(path_parts):
            if part and '.pdf' in part.lower():
                return part
        
        # Fallback: generate from URL hash
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        return f"paper_{url_hash}.pdf"
    
    async def delete_file(self, file_path: str) -> ToolResult:
        """
        Delete a downloaded PDF file.
        
        Args:
            file_path: Path to file to delete
            
        Returns:
            ToolResult indicating success
        """
        try:
            path = Path(file_path)
            if path.exists() and path.is_file():
                path.unlink()
                return self._success(
                    data={"deleted": True, "file_path": file_path}
                )
            else:
                return self._error(f"File not found: {file_path}")
        except Exception as e:
            return self._error(f"Error deleting file: {str(e)}")