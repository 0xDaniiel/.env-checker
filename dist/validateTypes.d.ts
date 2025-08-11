import dotenv from "dotenv";
export type ValidationResult = {
    errors: string[];
};
/**
 * Validate environment variables against example variables with type/format rules.
 * @param envVars Parsed env variables from .env file
 * @param exampleContent Raw content of .env.example file (with comments)
 * @returns ValidationResult with errors if any
 */
export declare function validateTypes(envVars: dotenv.DotenvParseOutput, exampleContent: string): ValidationResult;
//# sourceMappingURL=validateTypes.d.ts.map