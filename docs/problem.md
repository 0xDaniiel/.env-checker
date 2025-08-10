# Problem

Environment variables are critical for configuring applications — they store API keys, database credentials, and environment-specific settings.

But `.env` files are fragile:

- **Missing variables** break features at runtime.
- **Extra variables** accumulate, causing confusion.
- **Wrong formats/types** (e.g., port as a string, boolean as `"yes"`) lead to subtle bugs.
- **Sensitive values** can accidentally be stored in plain text or committed to Git.
- **No CI/CD checks** means bad configs reach production before anyone notices.

**Current pain points:**

1. Developers discover missing env vars _only after_ deploying.
2. Teams waste time guessing the correct `.env` structure.
3. Manual `.env.example` maintenance is error-prone.
4. Security leaks happen when secrets are mishandled.
