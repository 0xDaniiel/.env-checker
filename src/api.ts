import dotenv from "dotenv";
import fs from "fs";
import { validateTypes } from "./validateTypes.ts";
import { detectSensitive } from "./detectSensitive.ts";
export type CheckOptions = {
  envPaths: string[]; // paths to .env files, merged in order
  examplePath: string; // path to .env.example
};

export type CheckResult = {
  missing: string[];
  extra: string[];
  typeErrors: string[];
  sensitiveWarnings: string[];
};

/**
 * Loads and merges multiple .env files, last files override earlier ones.
 */
export function loadEnvFiles(envPaths: string[]): Record<string, string> {
  let mergedEnvVars: Record<string, string> = {};
  for (const p of envPaths) {
    if (!fs.existsSync(p)) continue;
    const result = dotenv.config({ path: p });
    if (result.error) {
      throw result.error;
    }
    mergedEnvVars = { ...mergedEnvVars, ...result.parsed };
  }
  return mergedEnvVars;
}

/**
 * Parses the example file and returns its content as string
 */
export function loadExampleFile(examplePath: string): string {
  if (!fs.existsSync(examplePath)) {
    throw new Error(`Example file not found: ${examplePath}`);
  }
  return fs.readFileSync(examplePath, "utf-8");
}

/**
 * Main check function: compares env with example, validates types, and detects sensitive info
 */
export function checkEnv(options: CheckOptions): CheckResult {
  const envVars = loadEnvFiles(options.envPaths);
  const exampleContent = loadExampleFile(options.examplePath);
  const exampleVars = dotenv.parse(exampleContent);

  const missing = Object.keys(exampleVars).filter((key) => !(key in envVars));
  const extra = Object.keys(envVars).filter((key) => !(key in exampleVars));
  const { errors: typeErrors } = validateTypes(envVars, exampleContent);
  const sensitiveWarnings = detectSensitive(envVars);

  return { missing, extra, typeErrors, sensitiveWarnings };
}
