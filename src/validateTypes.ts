import dotenv from "dotenv";

export type ValidationResult = {
  errors: string[];
};

function parseTypeAnnotations(exampleContent: string): Record<string, string> {
  const typeMap: Record<string, string> = {};
  const lines = exampleContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Split on first '#' safely
    const hashIndex = trimmed.indexOf("#");
    let beforeHash = trimmed;
    let afterHash = "";

    if (hashIndex !== -1) {
      beforeHash = trimmed.substring(0, hashIndex).trim();
      afterHash = trimmed.substring(hashIndex + 1).trim();
    }

    // Split on first '=' safely
    const equalIndex = beforeHash.indexOf("=");
    if (equalIndex === -1) continue; // invalid line, skip

    const key = beforeHash.substring(0, equalIndex).trim();
    if (!key) continue; // skip empty key

    typeMap[key] = afterHash || "string"; // default to string if no comment
  }

  return typeMap;
}

/**
 * Validate environment variables against example variables with type/format rules.
 * @param envVars Parsed env variables from .env file
 * @param exampleContent Raw content of .env.example file (with comments)
 * @returns ValidationResult with errors if any
 */
export function validateTypes(
  envVars: dotenv.DotenvParseOutput,
  exampleContent: string
): ValidationResult {
  const errors: string[] = [];
  const typeMap = parseTypeAnnotations(exampleContent);

  for (const key in typeMap) {
    const expectedType = typeMap[key] ?? "string"; // fallback to "string"

    const value = envVars[key];

    if (value === undefined) {
      errors.push(`Missing variable: ${key}`);
      continue;
    }
    if (!value) {
      errors.push(`Variable "${key}" is empty`);
      continue;
    }

    // Basic type checks
    switch (expectedType.toLowerCase()) {
      case "number":
        if (isNaN(Number(value))) {
          errors.push(
            `Variable "${key}" should be a number but got "${value}"`
          );
        }
        break;
      case "boolean":
        if (!["true", "false"].includes(value.toLowerCase())) {
          errors.push(
            `Variable "${key}" should be a boolean ("true" or "false") but got "${value}"`
          );
        }
        break;
      case "string":
      default:
        // No extra validation for string for now
        break;
    }
  }

  return { errors };
}
