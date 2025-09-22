github-config.service.ts
This service is the centralized configuration provider for all GitHub-related settings in your NestJS application.

Instead of other parts of the app pulling values directly from .env, this service:

Reads environment variables through Nest’s ConfigService.

Validates them (ensures they are positive numbers or required strings).

Provides defaults from a constants file if the environment doesn’t define them.

Exposes a clean, immutable, camelCase config object that the rest of your app can safely consume.

⚙️ What it actually does step by step

Defines expected config shape (Config type with maxRepositories, cacheTimeout, etc.).

Loads values from environment (e.g., MAX_REPOSITORIES, CACHE_TIMEOUT_MS, etc.) using ConfigService.

Applies defaults from DEFAULTS if no environment variable is provided.

Validates that numbers are valid (positive integers).

Builds an immutable config object (this.config) with developer-friendly camelCase keys.

Provides access to the GitHub token (GITHUB_TOKEN) and throws an error if it’s missing.

defaults.ts
Default configuration values for GitHub-related operations.
These are used when no environment variables are provided.

github.exceptions.ts
This file defines a set of custom error classes for handling GitHub-related failures in a NestJS application.
Instead of throwing generic Error objects, you throw typed exceptions (GitHubNotFoundError, GitHubRateLimitError, etc.) that:

Carry the correct HTTP status code.

Include optional debugging context.

Make it easier for error filters, logging, and clients to understand what went wrong.

github.validators.ts
GitHubValidators is a utility class that centralizes input validation for GitHub-related parameters.
It ensures that inputs like usernames, repository names, owners, and star ranges are well-formed before making API calls or processing data.

By throwing GitHubValidationError when a value is invalid, it allows the application to:

Fail fast with clear error messages.

Avoid unnecessary API calls to GitHub with invalid data.

Provide detailed context for logging/debugging (context property in the error).

github.validators.spec.ts
This file unit tests the GitHubValidators class to ensure that:

Usernames are validated and sanitized correctly.

Repository names are validated and sanitized correctly.

Star ranges are correctly validated.

Invalid inputs throw GitHubValidationError with the expected conditions.

It’s part of defensive testing to prevent invalid GitHub inputs from entering your app.

common.module.ts
🎯 Purpose

This NestJS module serves as a shared/common module that provides GitHub-related utilities across your application.

GitHubConfigService → centralized, validated configuration for GitHub API usage.

GitHubValidators → reusable validation logic for usernames, repository names, owners, and star ranges.

By exporting these providers, any other module that imports CommonModule can access them via dependency injection.

random-repository-query.dto.ts
This file defines a Data Transfer Object (DTO) for validating query parameters when fetching random GitHub repositories via your API.

Specifically, it handles:

min_stars → optional minimum number of stars a repository must have.

max_stars → optional maximum number of stars a repository can have.

The DTO ensures:

Values are numbers (converted using class-transformer).

Optional fields are allowed.

Values respect business constraints (0 ≤ stars ≤ 1,000,000).

Integration with Swagger (@ApiProperty) for API documentation.

readme.dto.ts
🎯 Purpose

The ReadmeDto class is a Data Transfer Object (DTO) that represents the structure of a GitHub repository's README file in your API.

It is used to:

Standardize the response when returning README data to clients.

Document the API via Swagger (@ApiProperty).

Provide type safety for TypeScript consumers.

repository.dto.ts
Purpose

RepositoryDto

Represents a GitHub repository with all relevant metadata for API responses.

Used for full repository details, including the lastCommitDate, which may require an additional API call.

Provides Swagger documentation (@ApiProperty) for all fields.

RandomRepositoryDto

A lightweight DTO for returning “random” repositories.

Excludes the lastCommitDate field because fetching it is more expensive (requires extra API call).

Uses PickType to inherit most fields from RepositoryDto without duplicating code.'

user-summary.dto.ts
UserSummaryDto is a Data Transfer Object (DTO) representing a GitHub user’s profile summary in your API.

It includes:

Basic profile info: username, name, bio, location, company, blog, avatar.

Stats: followers, following, public repositories, public gists.

Metadata: account creation and last update dates, GitHub profile URL.

Top repositories: an array of RepositoryDto objects representing the user’s top 5 repositories by stars.

Optional performance metadata: cached and responseTime for API monitoring and caching insights.

This DTO is designed for read-only responses, providing a rich summary of a user in one payload.

username-param.dto.ts
Purpose

UsernameParamDto is a Data Transfer Object (DTO) for validating a GitHub username passed as a request parameter.

It ensures that any username provided:

Meets GitHub’s username rules (alphanumeric + single hyphens, no leading/trailing hyphen).

Has a valid length (1–39 characters).

Is properly documented for Swagger.

This is typically used in route parameters for endpoints like:

GET /users/:username

test-factories.ts
🎯 Purpose

This file provides factory functions and constants to generate mock data for testing your GitHub-related services and DTOs.

It allows tests to be deterministic, concise, and reusable, avoiding repetitive setup for each test case.

github.service.spec.ts
🎯 Purpose

This file contains unit tests for the GitHubService, covering the main behaviors of fetching GitHub user stats and repository data.

It uses Vitest and NestJS testing utilities to mock dependencies and ensure the service behaves correctly under different scenarios:

Caching

API fetching

Input validation

github-exception.filter.ts
Purpose / What this file does

Provides a global exception filter for NestJS specifically handling GitHub API errors.

Converts raw GitHub API errors or generic errors into standardized HTTP responses with proper status codes and messages.

Logs detailed information (username, repository, request path, method) for debugging.

Maps common GitHub errors (404, 403, 422) to human-readable messages for the client.

Essentially, it normalizes GitHub API errors and ensures consistent logging and HTTP responses.

github.interfaces.ts
Purpose / What this file does

Defines TypeScript interfaces for GitHub-related data structures, including:

GitHubUser → raw API user object from GitHub

GitHubRepository → raw API repository object

RepositoryDto → normalized DTO for internal use

LanguageStat → statistics for programming languages in repos

LastCommit → metadata about a repository’s last commit

UserStats → aggregated user data for summaries, including top repos, languages, last commit, etc.

Essentially, it types GitHub API responses and transformed data, enabling strong typing throughout the service layer and DTO transformations.

GitHubService - Main Orchestration Layer
Purpose: High-level business logic coordinator that combines the three core services
What it does:

Orchestrates workflows: Coordinates between API calls, caching, and data transformation
Implements cache-first strategy: Always checks cache before hitting GitHub's API
Provides business methods: User stats, repository details, README files, search functionality
Handles validation: Uses validators to ensure clean input data
Manages errors: Comprehensive error handling with logging and graceful failures
Optimizes performance: Batch operations, response time tracking, smart caching

Key Methods:

getUserStats() - Complete user profile with top repositories
getRepository() - Single repository with commit data
getUserRepositories() - User's repos with sorting/filtering options
searchRepositories() - GitHub search with pagination
getRandomRepository() - Discovery feature for random repos

Flow: Validate input → Check cache → Call API services → Transform data → Cache result → Return to controller
This is the main service your controllers would interact with - it handles all the complexity of coordinating between GitHub's API, caching, and data transformation while providing clean, business-focused methods.

GitHubController - API Endpoint Layer
Purpose: REST API controller that exposes HTTP endpoints for GitHub functionality
What it does:

Defines REST endpoints: Maps HTTP requests to service methods
Handles HTTP concerns: URL parameters, query strings, response formatting
Provides API documentation: Comprehensive Swagger/OpenAPI annotations
Validates input: Uses DTOs with validation pipes for request data
Manages errors: Custom exception filter for GitHub-specific errors

Endpoints:

GET /v1/users/:username/summary - User profile with top repositories
GET /v1/repositories/random - Random repository discovery
GET /v1/repos/:owner/:repo - Specific repository details
GET /v1/repos/:owner/:repo/readme - Repository README content

Key Features:

Clean API design: RESTful routes with proper HTTP semantics
Input validation: DTOs ensure type safety and validation
Error handling: Centralized exception filtering
Auto-documentation: Swagger decorators generate API docs
Parameter mapping: Clean conversion from HTTP params to service calls

Flow: HTTP request → Validation → Service call → Response formatting → HTTP response
This controller serves as the thin HTTP layer that translates web requests into service method calls, focusing purely on HTTP concerns while delegating business logic to the GitHubService.
