import dotenv from "dotenv";

export type ValidationResult = {
  errors: string[];
};

/**
 * Validate environment variables against example variables with type/format rules.
 * @param envVars Parsed env variables from .env file
 * @param exampleVars Parsed env variables from .env.example file (including comments)
 * @returns ValidationResult with errors if any
 */
export function validateTypes(
  envVars: dotenv.DotenvParseOutput,
  exampleVars: dotenv.DotenvParseOutput
): ValidationResult {
  const errors: string[] = [];

  // Example stub: Check that variables exist and are not empty
  for (const key in exampleVars) {
    if (!(key in envVars)) {
      errors.push(`Missing variable: ${key}`);
    } else {
      const value = envVars[key];
      if (!value) {
        errors.push(`Variable "${key}" is empty`);
      }
      // TODO: Parse exampleVars comments to enforce types/formats
    }
  }

  // Optionally, check for extra variables in envVars not in exampleVars
  for (const key in envVars) {
    if (!(key in exampleVars)) {
      // Could be warning or error
      // errors.push(`Extra variable found: ${key}`);
    }
  }

  return { errors };
}
