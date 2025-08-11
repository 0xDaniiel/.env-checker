# `.env-checker` 🛡

![npm version](https://img.shields.io/npm/v/.env-checker)

> A fast, CI-friendly CLI & API to validate `.env` files — checks for missing/extra variables, type/format errors, and sensitive values. Includes `.env.example` generator.

---

## 📌 Overview

`.env-checker` helps you **catch configuration issues early** — before they break production.  
It compares your `.env` against `.env.example`, validates formats, detects secrets, and can auto-generate `.env.example` from your current config.

---

## ❗ Problem

Environment variables often cause **bugs, confusion, and security leaks** when they are missing, outdated, misformatted, or leaked to version control.  
📄 **Read more:** [docs/problem.md](docs/problem.md)

---

## 💡 Solution

Validate, enforce, and sanitize your `.env` files — locally and in CI/CD — so bad configs never make it to production.  
📄 **Read more:** [docs/solution.md](docs/solution.md)

---

## 🚀 Features

- Detect **missing/extra variables** by comparing `.env` ↔ `.env.example`.
- **Type & format validation** using comment-based rules.
- **Sensitive value detection** (tokens, keys, passwords).
- **CI/CD mode** to fail builds on invalid configs.
- **Auto `.env.example` generator** (strips secrets).
- Multi-file support (`.env.local`, `.env.production`, etc.).
- Friendly **color-coded output**.
- Works as both **CLI** and **JavaScript API**.

---

## 📦 Installation

```
npm install -g env-checker
# or locally
npm install --save-dev env-checker
```

## 🖥 Usage

### CLI

```
npx env-checker [options]
```

```
| Flag               | Description                                        |
| ------------------ | -------------------------------------------------- |
| `--ci`             | Run in CI mode (non-zero exit code on failure)     |
| `--generate`       | Create `.env.example` from `.env` (strips secrets) |
| `--path <file>`    | Specify `.env` file path                           |
| `--example <file>` | Specify `.env.example` path                        |
| `--json`           | Output results in JSON                             |
| `--help`           | Show help menu                                     |

```

## API Usage

You can use `.env-checker` programmatically in your Node.js or TypeScript projects.

### Importing

```ts
import { checkEnv } from "env-checker";

async function runCheck() {
  const result = checkEnv({
    envPaths: [".env", ".env.local"], // Paths to your .env files
    examplePath: ".env.example", // Path to your .env.example file
  });

  console.log("Missing variables:", result.missing);
  console.log("Extra variables:", result.extra);
  console.log("Type errors:", result.typeErrors);
  console.log("Sensitive warnings:", result.sensitiveWarnings);

  if (
    result.missing.length ||
    result.extra.length ||
    result.typeErrors.length ||
    result.sensitiveWarnings.length
  ) {
    throw new Error("Environment variables validation failed");
  }
}

runCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Options

```
| Option        | Description                               |
| ------------- | ----------------------------------------- |
| `envPaths`    | Array of paths to `.env` files to merge   |
| `examplePath` | Path to `.env.example` file for reference |
```

### Return Value

The `checkEnv` function returns an object containing:

- `missing`: Array of variable names missing in your env files but present in example.
- `extra`: Array of variable names present in env files but missing from example.
- `typeErrors`: Array of strings describing type or format validation errors.
- `sensitiveWarnings`: Array of strings warning about sensitive values detected.

### Notes

- You can integrate this API into your build or deploy scripts to enforce environment consistency.
- The API works synchronously and throws on file read or parse errors.
- For CI pipelines, use the CLI with the `--ci` flag for automatic failure on issues.

## 📜 License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a Pull Request

Please open an issue to discuss major changes before submitting a pull request.
