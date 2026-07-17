"""
Resume Parsing Service Module

Provides functionality to extract text from resume files in PDF and DOCX formats.
"""

from io import BytesIO
from typing import Union

from pypdf import PdfReader
from docx import Document


class ParsingError(Exception):
    """Custom exception for parsing errors."""
    pass


async def parse_pdf(file_content: bytes) -> str:
    """
    Extract text from a PDF file.

    Args:
        file_content: The raw bytes content of the PDF file.

    Returns:
        Extracted text from all pages of the PDF.

    Raises:
        ParsingError: If the PDF cannot be parsed.
    """
    try:
        pdf_file = BytesIO(file_content)
        pdf_reader = PdfReader(pdf_file)

        extracted_text = []
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if text:
                extracted_text.append(text)

        return "\n\n".join(extracted_text)
    except Exception as e:
        raise ParsingError(f"Failed to parse PDF: {str(e)}")


async def parse_docx(file_content: bytes) -> str:
    """
    Extract text from a DOCX (Word) file.

    Args:
        file_content: The raw bytes content of the DOCX file.

    Returns:
        Extracted text from all paragraphs in the DOCX file.

    Raises:
        ParsingError: If the DOCX cannot be parsed.
    """
    try:
        docx_file = BytesIO(file_content)
        document = Document(docx_file)

        extracted_text = []
        for paragraph in document.paragraphs:
            text = paragraph.text.strip()
            if text:
                extracted_text.append(text)

        return "\n".join(extracted_text)
    except Exception as e:
        raise ParsingError(f"Failed to parse DOCX: {str(e)}")


async def parse_resume(file_content: bytes, file_extension: str) -> str:
    """
    Parse a resume file based on its extension.

    Args:
        file_content: The raw bytes content of the file.
        file_extension: The file extension (e.g., 'pdf', 'docx').

    Returns:
        Extracted text from the resume file.

    Raises:
        ParsingError: If the file format is unsupported or parsing fails.
    """
    file_extension = file_extension.lower().strip(".")

    if file_extension == "pdf":
        return await parse_pdf(file_content)
    elif file_extension == "docx":
        return await parse_docx(file_content)
    else:
        raise ParsingError(f"Unsupported file format: .{file_extension}. Supported formats: PDF, DOCX")
