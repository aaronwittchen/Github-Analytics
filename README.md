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
