export function detectSensitive(envVars: Record<string, string>): string[] {
  const warnings: string[] = [];

  const sensitiveKeywords = [
    "KEY",
    "TOKEN",
    "SECRET",
    "PASSWORD",
    "PWD",
    "AUTH",
    "ACCESS",
  ];
  const suspiciousValuePattern = /^[a-zA-Z0-9-_]{20,}$/;

  for (const [key, value] of Object.entries(envVars)) {
    const upperKey = key.toUpperCase();

    // Ensure value is a string before testing
    if (typeof value === "string") {
      if (
        sensitiveKeywords.some((keyword) => upperKey.includes(keyword)) &&
        suspiciousValuePattern.test(value)
      ) {
        warnings.push(`Possible sensitive value detected in ${key}`);
      }
    }
  }

  return warnings;
}
