import fs from "fs";
import dotenv from "dotenv";

/**
 * Validates .env variables against .env.example.
 * - Detects missing and extra keys.
 * - Checks simple types: number, boolean, enum.
 * @param {string} envPath Path to .env file
 * @param {string} examplePath Path to .env.example file
 * @returns {object} { missing: [], extra: [], typeErrors: [] }
 */
export function validateEnv(envPath, examplePath) {
  // Load .env
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = dotenv.parse(envContent);

  // Load .env.example
  const exampleContent = fs.readFileSync(examplePath, "utf-8");

  // Parse example vars AND their comments for type hints
  const exampleLines = exampleContent.split("\n");

  // Parse vars and types from .env.example
  const exampleVars = {};
  exampleLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return; // skip comments/empty

    // Split at first '='
    const [key, ...rest] = trimmed.split("=");
    const valueAndComment = rest.join("=");

    // Extract inline comment after '#'
    const commentIndex = valueAndComment.indexOf("#");
    let comment = "";
    let value = valueAndComment;
    if (commentIndex !== -1) {
      comment = valueAndComment.slice(commentIndex + 1).trim();
      value = valueAndComment.slice(0, commentIndex).trim();
    }

    exampleVars[key.trim()] = {
      value,
      comment,
    };
  });

  // Check missing and extra keys
  const missing = Object.keys(exampleVars).filter((k) => !(k in envVars));
  const extra = Object.keys(envVars).filter((k) => !(k in exampleVars));

  // Type validation helper
  const typeErrors = [];

  function validateType(key, val, comment) {
    if (!comment.startsWith("type:")) return true; // no type info, skip

    const typeInfo = comment.slice(5).trim();

    if (typeInfo.startsWith("enum(")) {
      // enum case, parse values
      const enumValues = typeInfo
        .slice(5, -1)
        .split(",")
        .map((v) => v.trim());
      if (!enumValues.includes(val)) {
        return `Value '${val}' for '${key}' is not in enum: [${enumValues.join(
          ", "
        )}]`;
      }
      return true;
    }

    switch (typeInfo) {
      case "number":
        if (isNaN(Number(val))) {
          return `Value '${val}' for '${key}' is not a valid number`;
        }
        break;
      case "boolean":
        if (!["true", "false"].includes(val.toLowerCase())) {
          return `Value '${val}' for '${key}' is not a valid boolean (true/false)`;
        }
        break;
      // add more types if needed
    }

    return true;
  }

  // Validate types on keys present in both
  Object.entries(exampleVars).forEach(([key, { comment }]) => {
    if (key in envVars) {
      const val = envVars[key];
      const valid = validateType(key, val, comment);
      if (valid !== true) {
        typeErrors.push(valid);
      }
    }
  });

  return {
    missing,
    extra,
    typeErrors,
  };
}
