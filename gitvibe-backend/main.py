"""
GitVibe AI Backend - Main Application Entry Point

This module initializes the FastAPI application with:
- Environment variable configuration via python-dotenv
- CORS middleware for local development
- In-memory cache fallback (mocked Redis support)
- Health check endpoint
"""

import os
from typing import Any, Dict
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from parsers import parse_resume, ParsingError
from ai_service import extract_resume_analysis, AIServiceError
from github_service import fetch_user_repositories, GitHubServiceError

# ============================================================================
# Request Models
# ============================================================================


class GitHubRepositoryMetadata(BaseModel):
    """Schema for GitHub repository metadata used in project validation."""

    name: str
    description: str | None = None
    primary_language: str | None = None


class ResumeParseRequest(BaseModel):
    """Schema for resume parsing request with optional GitHub metadata."""

    github_repositories: list[GitHubRepositoryMetadata] = []

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# Configuration
# ============================================================================

GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
REDIS_URL: str = os.getenv("REDIS_URL", "mock")
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./gitvibe.db")
JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key")
BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", 8000))

# ============================================================================
# In-Memory Cache (Fallback for Mocked Redis)
# ============================================================================

class InMemoryCache:
    """
    Simple in-memory cache implementation for use when REDIS_URL is set to "mock".
    Provides get/set/delete operations with dictionary-based storage.
    """

    def __init__(self) -> None:
        self._store: Dict[str, Any] = {}

    def get(self, key: str) -> Any:
        """Retrieve a value from cache by key."""
        return self._store.get(key)

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Store a value in cache (ttl is ignored in this simple implementation)."""
        self._store[key] = value

    def delete(self, key: str) -> None:
        """Delete a value from cache by key."""
        self._store.pop(key, None)

    def clear(self) -> None:
        """Clear all values from cache."""
        self._store.clear()

    def exists(self, key: str) -> bool:
        """Check if a key exists in cache."""
        return key in self._store


# Initialize cache based on REDIS_URL
if REDIS_URL == "mock":
    cache: InMemoryCache = InMemoryCache()
else:
    # TODO: Implement Redis client when REDIS_URL is configured
    cache = InMemoryCache()

# ============================================================================
# Application Startup/Shutdown Events
# ============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    # Startup
    print("🚀 DevCred AI Backend starting...")
    print(f"📦 Redis Mode: {'Mocked (In-Memory)' if REDIS_URL == 'mock' else 'Connected'}")
    print(f"🗄️  Database: {DATABASE_URL}")
    yield
    # Shutdown
    print("🛑 DevCred AI Backend shutting down...")


# ============================================================================
# FastAPI Application Initialization
# ============================================================================

# Initialize the main FastAPI application instance. This 'app' object will be used
# by the Uvicorn server to handle incoming web requests. We've also attached a
# custom 'lifespan' context manager to execute code on startup and shutdown.
app = FastAPI(
    title="DevCred AI Backend",
    description="Backend API for DevCred AI - Resume parsing and GitHub integration",
    version="0.1.0",
    lifespan=lifespan,
)

# ============================================================================
# CORS Middleware Configuration
# ============================================================================

# Configure Cross-Origin Resource Sharing (CORS) to allow our frontend application,
# which is served from a different origin (port), to communicate with this backend API.
# The wildcard settings ("*") are permissive and suitable for local development but
# should be restricted to the specific frontend URL in a production environment for security.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Routes
# ============================================================================


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint to verify the API is running.

    This simple route provides a basic '200 OK' response if the server is active,
    allowing automated monitoring services to confirm the application's availability.
    It also returns a snapshot of the current configuration for debugging purposes.

    Returns:
        Dictionary with status and configuration information.
    """
    return {
        "status": "healthy",
        "redis_mocked": REDIS_URL == "mock",
        "database": DATABASE_URL.split("///")[1] if "sqlite" in DATABASE_URL else "postgresql",
    }


@app.post("/api/v1/resume/parse", tags=["Resume Parsing"])
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    github_username: str | None = Query(None, description="Optional GitHub username for repository validation"),
) -> Dict[str, Any]:
    """
    Parse a resume file and extract text content with AI analysis and GitHub project validation.

    Supports PDF (.pdf) and DOCX (.docx) file formats. Uses Google Gemini API
    to extract candidate name, technical skills, and validate projects against
    fetched GitHub repository metadata.

    Query Parameters:
        - github_username (optional): GitHub username to fetch public repositories for project validation.
          Example: ?github_username=torvalds

    Args:
        file: The uploaded resume file (PDF or DOCX). FastAPI handles the incoming
              binary data as an 'UploadFile' object, which allows for efficient,
              asynchronous reading of the file content directly from the stream.
        github_username: Optional GitHub username for fetching public repositories.

    Returns:
        Dictionary containing file metadata, extracted text, and AI analysis with project validation.

    Raises:
        HTTPException: If the file format is unsupported, parsing fails, GitHub fetch fails, or AI analysis fails.
    """
    import json

    # Validate file extension to ensure we only process supported document types.
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required")

    file_extension = file.filename.split(".")[-1].lower()
    supported_formats = ["pdf", "docx"]

    if file_extension not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: .{file_extension}. Supported formats: {', '.join(supported_formats)}",
        )

    try:
        # Asynchronously read the entire binary content of the uploaded file into memory.
        # This is a crucial step where the server processes the data streamed from the client.
        file_content = await file.read()

        if not file_content:
            raise HTTPException(status_code=400, detail="File is empty")

        # Step 1: Parse the resume's binary content to extract raw, unstructured text.
        # This abstracts the complexity of handling different file formats (PDF, DOCX).
        extracted_text = await parse_resume(file_content, file_extension)

        # Step 2: If a GitHub username is provided, asynchronously query the GitHub API
        # to fetch a list of the user's public repositories. This external call is
        # executed without blocking the main server thread, thanks to FastAPI's async support.
        github_metadata: list[Dict[str, Any]] = []
        github_fetch_status = "skipped"

        if github_username:
            try:
                # The 'fetch_user_repositories' function uses an asynchronous HTTPX client
                # to efficiently pull repository data from the public GitHub API.
                github_metadata = await fetch_user_repositories(github_username)
                github_fetch_status = "success"
            except GitHubServiceError as e:
                raise HTTPException(status_code=400, detail=f"GitHub fetch error: {str(e)}")

        # Step 3: Pass the extracted text and GitHub data to the AI service. The AI model
        # will then cross-reference the projects mentioned in the resume against the fetched
        # repository details to validate their existence and extract key insights.
        ai_analysis = await extract_resume_analysis(extracted_text, github_metadata)

        # Finally, compile and return a structured JSON response containing all the
        # processed data, from the raw text to the final AI-generated analysis.
        return {
            "status": "success",
            "filename": file.filename,
            "file_type": file_extension.upper(),
            "github_validation": {
                "status": github_fetch_status,
                "username": github_username if github_username else None,
                "repositories_found": len(github_metadata),
            },
            "raw_text": extracted_text,
            "analysis": {
                "candidate_name": ai_analysis["candidate_name"],
                "detected_skills": ai_analysis["detected_skills"],
                "extracted_projects": ai_analysis["extracted_projects"],
            },
        }

    except ParsingError as e:
        raise HTTPException(status_code=422, detail=f"Parsing error: {str(e)}")
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=f"AI analysis error: {str(e)}")
    except GitHubServiceError as e:
        raise HTTPException(status_code=502, detail=f"GitHub service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# ============================================================================
# Application Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=BACKEND_PORT,
        reload=True,
        log_level="info",
    )
