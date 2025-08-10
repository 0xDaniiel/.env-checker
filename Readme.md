# `.env-checker` 🛡

![npm version](https://img.shields.io/npm/v/env-checker)

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

## API

```
import { checkEnv } from 'env-checker';

checkEnv({
requiredFile: '.env.example',
envFile: '.env',
ci: true
});
```

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a Pull Request

Please open an issue to discuss major changes before submitting a pull request.
