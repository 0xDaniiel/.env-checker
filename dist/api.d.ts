export type CheckOptions = {
    envPaths: string[];
    examplePath: string;
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
export declare function loadEnvFiles(envPaths: string[]): Record<string, string>;
/**
 * Parses the example file and returns its content as string
 */
export declare function loadExampleFile(examplePath: string): string;
/**
 * Main check function: compares env with example, validates types, and detects sensitive info
 */
export declare function checkEnv(options: CheckOptions): CheckResult;
//# sourceMappingURL=api.d.ts.map