"""
Google Gemini AI Service Module

Provides integration with Google Gemini API for resume analysis and skill extraction.
Uses the modern google-genai SDK with structured output.
"""

from dotenv import load_dotenv

# Load environment variables at the very top
load_dotenv()

import os
from typing import Any, Dict

from pydantic import BaseModel
from google import genai
from google.genai import types


class AIServiceError(Exception):
    """Custom exception for AI service errors."""
    pass


# ============================================================================
# Pydantic Models for Structured Output
# ============================================================================


class ProjectValidation(BaseModel):
    """
    Defines the data structure for a single, validated project. By using Pydantic,
    we ensure that the data returned by the AI model conforms to this schema,
    providing type safety and predictable structures. This helps prevent runtime
    errors caused by unexpected or missing data fields.
    """

    project_name: str
    resume_description: str
    matching_github_repo: str | None
    verification_status: str
    confidence_reasoning: str


class ResumeAnalysis(BaseModel):
    """
    This is the top-level Pydantic model that defines the complete, structured JSON
    output we expect from the AI service. It acts as a contract, ensuring that the
    AI's response is always a valid JSON object with the correct field names and
    data types (e.g., 'candidate_name' must be a string, 'detected_skills' must be a
    list of strings). This strictness is critical for reliable data processing downstream.
    """

    candidate_name: str
    detected_skills: list[str]
    extracted_projects: list[ProjectValidation]


# ============================================================================
# Gemini Client Initialization
# ============================================================================

# Retrieve the Gemini API key from environment variables. This is a secure way to
# manage credentials without hardcoding them into the source code.
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

# Initialize the 'google-genai' client. This 'client' object is our gateway to
# the Gemini API and will be used to execute the generative model calls.
client = genai.Client(api_key=GEMINI_API_KEY)


# ============================================================================
# System Prompt for Technical Recruiter with Project Validation
# ============================================================================

# This multi-layered system prompt is the core instruction set that guides the AI model's
# behavior. It sets the persona (an expert technical recruiter), defines the exact task,
# and provides explicit rules for how to analyze the resume text and cross-reference it
# with GitHub data. By clearly defining the expected output format (JSON), we teach the
# model to return clean, structured data that aligns with our Pydantic models.
RECRUITER_SYSTEM_PROMPT = """You are an expert technical recruiter with deep knowledge of software development, programming languages, frameworks, tools, and technologies. You are also skilled at validating candidate projects against real GitHub repositories.

Your task is to analyze resume text and extract:
1. The candidate's name (look for the first section, headers, or any indication of the person's name)
2. All technical skills mentioned in the text (programming languages, frameworks, libraries, tools, databases, cloud platforms, etc.)
3. All projects mentioned in the resume and validate them against provided GitHub repository metadata

PROJECT VALIDATION RULES:
- For each project mentioned in the resume, search for a matching GitHub repository in the provided metadata
- Cross-reference by:
  * Matching project names (exact or similar)
  * Comparing resume project descriptions with GitHub repo descriptions
  * Analyzing primary language alignment
- Assign verification_status as one of:
  * "Verified" - Resume project description logically correlates with actual code details and repo description
  * "Tutorial Clone" - Repository shows signs of being a tutorial or boilerplate clone (single commit, basic structure, standard naming)
  * "Unverified" - No matching GitHub repo found or insufficient correlation to verify
- Set matching_github_repo to the actual repo name if found, otherwise null
- Provide brief confidence_reasoning explaining the validation decision

If no projects are found in the resume, return an empty extracted_projects array.

Return the results as a JSON object matching the exact structure specified."""


# ============================================================================
# Resume Analysis Function
# ============================================================================


async def extract_resume_analysis(resume_text: str, github_metadata: list[Dict[str, Any]] | None = None) -> Dict[str, Any]:
    """
    Analyze resume text using Google Gemini API and extract candidate information, skills, and validated projects.

    This function orchestrates the entire AI analysis process. It uses the modern 'google-genai'
    SDK, which supports structured JSON output. This feature is critical, as it forces the
    model to return data that conforms to our Pydantic 'ResumeAnalysis' schema, eliminating
    the need for manual string parsing and making the integration far more robust.

    Args:
        resume_text: The extracted text content from the resume file.
        github_metadata: Optional list of GitHub repository metadata for project validation.
                        Each item should contain: name, description, primary_language, etc.

    Returns:
        A dictionary containing the candidate's name, detected skills, and a list of
        projects that have been cross-referenced and validated against the GitHub metadata.

    Raises:
        AIServiceError: If the API call fails or if the response is malformed or invalid.
    """
    try:
        # Configure the Gemini client to expect a structured JSON response. By providing
        # our Pydantic 'ResumeAnalysis' model as the response schema, we instruct the
        # 'google-genai' library to handle the validation automatically. This ensures
        # that the API response will always match the data structure we need.
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ResumeAnalysis,
            temperature=0.0,
        )

        # Build a context block containing the GitHub repository metadata. This string
        # is appended to the main prompt, providing the model with the necessary data
        # to perform its cross-referencing and validation task.
        github_context = ""
        if github_metadata:
            github_context = "\n\nGitHub Repository Metadata for Cross-Reference Validation:\n"
            for repo in github_metadata:
                repo_name = repo.get("name", "Unknown")
                repo_desc = repo.get("description", "No description")
                repo_lang = repo.get("primary_language", "Unknown")
                github_context += f"\n- Repository: {repo_name}\n  Language: {repo_lang}\n  Description: {repo_desc}"

        # Combine the system instructions, the raw resume text, and the GitHub context
        # into a single, unified prompt for the model.
        prompt = (
            f"{RECRUITER_SYSTEM_PROMPT}\n\n"
            f"Resume Text to Analyze:\n{resume_text}"
            f"{github_context}"
        )

        # Execute the main generative call to the Gemini API. The client sends the
        # complete prompt and awaits a structured JSON response. The underlying 'google-genai'
        # library handles the HTTP requests and response parsing in a unified execution loop.
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
            config=config,
        )

        # --- Start Security Hardening ---
        # Mask detailed error messages with generic ones.
        if not response or not response.text:
            raise AIServiceError("AI service returned an empty or invalid response.")

        response_text = response.text.strip()

        # Parse the JSON response string into a Python dictionary.
        try:
            import json

            result = json.loads(response_text)
        except json.JSONDecodeError:
            raise AIServiceError("Failed to decode the response from the AI service.")

        # Validate the parsed dictionary against our Pydantic schema to ensure all
        # required fields are present and correctly typed.
        try:
            analysis = ResumeAnalysis(**result)
        except Exception:
            raise AIServiceError("The AI service response did not match the expected data structure.")
        # --- End Security Hardening ---

        # Return the final, validated data structure as a dictionary.
        return {
            "candidate_name": analysis.candidate_name,
            "detected_skills": analysis.detected_skills,
            "extracted_projects": [
                {
                    "project_name": proj.project_name,
                    "resume_description": proj.resume_description,
                    "matching_github_repo": proj.matching_github_repo,
                    "verification_status": proj.verification_status,
                    "confidence_reasoning": proj.confidence_reasoning,
                }
                for proj in analysis.extracted_projects
            ],
        }

    except AIServiceError:
        # Re-raise our custom, sanitized exceptions directly.
        raise
    except Exception:
        # Catch any other unexpected exceptions and wrap them in a generic error.
        raise AIServiceError("An unexpected error occurred during AI-powered resume analysis.")

