"""
GitHub API Service Module

Provides functionality to fetch public GitHub repository data for a given user.
"""

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
        raise GitHubServiceError("GitHub username cannot be empty")

    username = username.strip()

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

            # Handle various HTTP responses
            if response.status_code == 404:
                raise GitHubServiceError(f"GitHub user '{username}' not found")
            elif response.status_code == 403:
                raise GitHubServiceError("GitHub API rate limit exceeded or access denied")
            elif response.status_code != 200:
                raise GitHubServiceError(
                    f"GitHub API error: HTTP {response.status_code} - {response.text}"
                )

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
        raise GitHubServiceError(f"GitHub API request timed out while fetching repositories for '{username}'")
    except httpx.RequestError as e:
        raise GitHubServiceError(f"Failed to connect to GitHub API: {str(e)}")
    except ValueError as e:
        raise GitHubServiceError(f"Invalid response from GitHub API: {str(e)}")
    except Exception as e:
        raise GitHubServiceError(f"Unexpected error fetching GitHub repositories: {str(e)}")
