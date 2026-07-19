"""
GitHub API Service Module

Provides functionality to fetch public GitHub repository data for a given user.
"""
import re
from typing import Any, Dict, List

import httpx


class GitHubServiceError(Exception):
    """Custom exception for GitHub service errors."""
    pass


GITHUB_API_BASE_URL = "https://api.github.com"
GITHUB_API_TIMEOUT = 10.0


async def fetch_user_repositories(username: str) -> List[Dict[str, Any]]:
    """
    Fetch all public repositories for a GitHub user.

    Args:
        username: GitHub username to fetch repositories for.

    Returns:
        List of dictionaries containing repository metadata:
        - name: Repository name
        - description: Repository description (can be None)
        - language: Primary programming language (can be None)

    Raises:
        GitHubServiceError: If the API call fails or user is not found.
    """
    if not username or not username.strip():
        raise GitHubServiceError("Invalid GitHub username provided.")

    username = username.strip()

    # --- Start Security Hardening ---
    # Sanitize username to prevent injection attacks.
    # GitHub usernames may contain alphanumeric characters and hyphens.
    if not re.match(r"^[a-zA-Z0-9\-]+$", username):
        raise GitHubServiceError("Invalid characters in GitHub username.")
    # --- End Security Hardening ---

    try:
        async with httpx.AsyncClient(timeout=GITHUB_API_TIMEOUT) as client:
            # Fetch user's public repositories
            url = f"{GITHUB_API_BASE_URL}/users/{username}/repos"
            response = await client.get(
                url,
                params={
                    "type": "public",
                    "sort": "updated",
                    "per_page": 100,  # Fetch up to 100 repos
                },
            )

            # --- Start Security Hardening ---
            # Mask detailed internal errors with generic, ambiguous messages.
            if response.status_code == 404:
                # Ambiguous message: could be user not found or private.
                raise GitHubServiceError("Could not retrieve repository data for the specified user.")
            elif response.status_code == 403:
                raise GitHubServiceError("Access to the requested GitHub resource was denied.")
            elif response.status_code != 200:
                raise GitHubServiceError("An external service error occurred while fetching repository data.")
            # --- End Security Hardening ---

            repositories = response.json()

            # Transform API response to our metadata schema
            metadata_list = []
            for repo in repositories:
                metadata_list.append(
                    {
                        "name": repo.get("name", ""),
                        "description": repo.get("description"),
                        "primary_language": repo.get("language"),
                    }
                )

            return metadata_list

    except httpx.TimeoutException:
        raise GitHubServiceError("The request to the external repository service timed out.")
    except httpx.RequestError:
        raise GitHubServiceError("A network error occurred while connecting to the external repository service.")
    except ValueError:
        raise GitHubServiceError("Received an invalid response from the external repository service.")
    except GitHubServiceError:
        # Re-raise specific, sanitized exceptions from the check above.
        raise
    except Exception:
        raise GitHubServiceError("An unexpected system error occurred while processing the repository request.")

