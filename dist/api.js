import dotenv from "dotenv";
import fs from "fs";
import { validateTypes } from "./validateTypes.js";
import { detectSensitive } from "./detectSensitive.js";
/**
 * Loads and merges multiple .env files, last files override earlier ones.
 */
export function loadEnvFiles(envPaths) {
    let mergedEnvVars = {};
    for (const p of envPaths) {
        if (!fs.existsSync(p))
            continue;
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
export function loadExampleFile(examplePath) {
    if (!fs.existsSync(examplePath)) {
        throw new Error(`Example file not found: ${examplePath}`);
    }
    return fs.readFileSync(examplePath, "utf-8");
}
/**
 * Main check function: compares env with example, validates types, and detects sensitive info
 */
export function checkEnv(options) {
    const envVars = loadEnvFiles(options.envPaths);
    const exampleContent = loadExampleFile(options.examplePath);
    const exampleVars = dotenv.parse(exampleContent);
    const missing = Object.keys(exampleVars).filter((key) => !(key in envVars));
    const extra = Object.keys(envVars).filter((key) => !(key in exampleVars));
    const { errors: typeErrors } = validateTypes(envVars, exampleContent);
    const sensitiveWarnings = detectSensitive(envVars);
    return { missing, extra, typeErrors, sensitiveWarnings };
}
//# sourceMappingURL=api.js.map