// src/cli.ts
import { Command } from "commander";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";

type EnvEntry = { value?: string; comment?: string; meta?: { type?: string; enum?: string[] } };

function splitValueAndComment(raw: string): { value: string; comment?: string } {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "#" && !inSingle && !inDouble) {
      const value = raw.slice(0, i).trim();
      const comment = raw.slice(i + 1).trim();
      return { value, comment };
    }
  }
  return { value: raw.trim() };
}

async function parseEnvFile(filePath: string): Promise<Map<string, EnvEntry>> {
  const map = new Map<string, EnvEntry>();
  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const raw = line.slice(eq + 1);
      const { value, comment } = splitValueAndComment(raw);
      let cleaned = value;
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
      const entry: EnvEntry = { value: cleaned, comment };
      if (comment) {
        const m = comment.match(/type\s*:\s*([a-zA-Z0-9_]+\([^\)]*\)|[a-zA-Z0-9_]+)/i);
        if (m) {
          const t = m[1];
          if (t.toLowerCase().startsWith("enum(")) {
            const inner = t.slice(t.indexOf("(") + 1, t.lastIndexOf(")"));
            entry.meta = { type: "enum", enum: inner.split(",").map(s => s.trim()) };
          } else {
            entry.meta = { type: t.toLowerCase() };
          }
        }
      }
      map.set(key, entry);
    }
  } catch (err) {
    // file missing will be handled by caller
  }
  return map;
}

function validateType(value: string | undefined, meta?: EnvEntry["meta"]): string | null {
  if (!meta) return null;
  const t = meta.type;
  if (!t) return null;
  if (t === "number") {
    if (value === undefined || value === "") return "expected number, got empty";
    const n = Number(value);
    if (Number.isNaN(n)) return `expected number but value "${value}" is not numeric`;
    return null;
  }
  if (t === "boolean") {
    const v = (value || "").toLowerCase();
    if (["true", "false", "0", "1"].includes(v)) return null;
    return `expected boolean (true/false/0/1) but got "${value}"`;
  }
  if (t === "enum" && meta.enum) {
    if ((value || "") === "") return `expected one of [${meta.enum.join(", ")}] but got empty`;
    if (!meta.enum.includes(value || "")) return `expected one of [${meta.enum.join(", ")}] but got "${value}"`;
    return null;
  }
  // fallback: treat as string => always ok
  return null;
}

function detectSensitive(value: string | undefined) {
  if (!value) return null;
  const tests: { name: string; regex: RegExp }[] = [
    { name: "JWT-like", regex: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/ },
    { name: "AWS Access Key (AKIA...)", regex: /^AKIA[0-9A-Z]{16}$/ },
    { name: "Private key block", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
    { name: "Long token (>=32 chars alnum/-. _)", regex: /^[A-Za-z0-9\-_\.]{32,}$/ }
  ];
  for (const t of tests) {
    if (t.regex.test(value)) return t.name;
  }
  return null;
}

async function run(opts: {
  envFile: string;
  exampleFile: string;
  strict: boolean;
  ignore: string[];
  json: boolean;
  ci: boolean;
}) {
  const envPath = path.resolve(opts.envFile);
  const examplePath = path.resolve(opts.exampleFile);

  const [envMap, exampleMap] = await Promise.all([
    parseEnvFile(envPath),
    parseEnvFile(examplePath)
  ]);

  const exampleKeys = Array.from(exampleMap.keys());
  const envKeys = Array.from(envMap.keys());

  const missing = exampleKeys.filter(k => !envMap.has(k));
  const extra = envKeys.filter(k => !exampleMap.has(k) && !opts.ignore.includes(k));

  const typeErrors: { key: string; error: string }[] = [];
  const sensitive: { key: string; issue: string }[] = [];

  for (const key of exampleKeys.filter(k => envMap.has(k))) {
    const ex = exampleMap.get(key)!;
    const value = envMap.get(key)!.value;
    const tv = validateType(value, ex.meta);
    if (tv) typeErrors.push({ key, error: tv });
    const s = detectSensitive(value);
    if (s) sensitive.push({ key, issue: s });
  }

  const hasIssues = missing.length || extra.length || typeErrors.length || sensitive.length;

  if (opts.json) {
    const out = { missing, extra, typeErrors, sensitive, ok: !hasIssues };
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(chalk.bold(`\nenv-checker report\n`));
    if (!hasIssues) {
      console.log(chalk.green("✅ All checks passed"));
    } else {
      if (missing.length) {
        console.log(chalk.red(`Missing variables (${missing.length}):`));
        missing.forEach(m => console.log("  -", m));
      } else {
        console.log(chalk.green("No missing variables"));
      }
      if (extra.length) {
        console.log(chalk.yellow(`Extra / orphan variables (${extra.length}):`));
        extra.forEach(e => console.log("  -", e));
      } else if (opts.strict) {
        console.log(chalk.green("No extra variables"));
      }
      if (typeErrors.length) {
        console.log(chalk.red(`Type/format errors (${typeErrors.length}):`));
        typeErrors.forEach(t => console.log("  -", t.key, ":", t.error));
      }
      if (sensitive.length) {
        console.log(chalk.yellow(`Suspicious/sensitive values (${sensitive.length}):`));
        sensitive.forEach(s => console.log("  -", s.key, "=>", s.issue));
      }
    }
    console.log("");
  }

  if (opts.ci && hasIssues) {
    process.exit(2);
  }
}

const program = new Command();
program
  .name("env-checker")
  .description("Lightweight env sanity checker")
  .option("--env <path>", "path to .env file", ".env")
  .option("--example <path>", "path to .env.example file", ".env.example")
  .option("--strict", "treat extra vars as error (default: warning)", false)
  .option("--ignore <list>", "comma-separated keys to ignore", (v) => v.split(","), [])
  .option("--json", "machine-readable JSON output", false)
  .option("--ci", "exit non-zero on issues (CI-friendly)", false)
  .action((opts) => {
    run({
      envFile: opts.env,
      exampleFile: opts.example,
      strict: opts.strict,
      ignore: opts.ignore || [],
      json: opts.json,
      ci: opts.ci
    }).catch(err => {
      console.error(chalk.red("Fatal:"), err instanceof Error ? err.message : err);
      process.exit(1);
    });
  });

program.parse(process.argv);
