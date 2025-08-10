# Solution — `.env-checker`

`.env-checker` is a CLI + API tool that makes environment variable management safe, consistent, and CI-friendly.

## What it Does

- **Validates** your `.env` files against `.env.example`
- **Detects** missing variables, extra/orphan variables, and wrong types
- **Flags** sensitive values (tokens, private keys, etc.)
- **Generates** `.env.example` automatically from `.env` (removing secrets)
- **Runs** locally or in CI/CD pipelines to block bad deployments

## Key Benefits

- 🚀 **Faster onboarding** — new developers get the right `.env` instantly
- 🛡 **Security** — catch secrets and unsafe configs before they leak
- ✅ **Consistency** — one source of truth for environment configs
- 🔄 **Automation** — no manual `.env.example` syncing
