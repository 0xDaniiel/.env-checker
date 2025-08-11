#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { loadEnvFiles, loadExampleFile } from "./api.js";
import { validateTypes } from "./validateTypes.js";
import { detectSensitive } from "./detectSensitive.js";

const program = new Command();

program
  .name("env-checker")
  .description("Validate and check your .env files")
  .version("1.0.0")
  .option("--ci", "Run in CI mode (exit non-zero on failure)")
  .option("--generate", "Generate .env.example from .env")
  .option("--path <file>", "Specify .env file path(s), comma-separated", ".env")
  .option("--example <file>", "Specify .env.example path", ".env.example")
  .option("--json", "Output results in JSON format")
  .action(async (options) => {
    // Parse and resolve env paths
    const envPaths = options.path
      .split(",")
      .map((p: string) => path.resolve(process.cwd(), p.trim()));

    if (options.generate) {
      try {
        // Generate .env.example from first env file only
        const envContent = fs.readFileSync(envPaths[0], "utf-8");
        const exampleContent = envContent
          .split("\n")
          .map((line) => {
            if (!line || line.trim().startsWith("#")) return line;
            const [key] = line.split("=");
            return `${key}=`;
          })
          .join("\n");
        const examplePath = path.resolve(process.cwd(), options.example);
        fs.writeFileSync(examplePath, exampleContent, "utf-8");
        console.log(
          chalk.green(`✅ Generated ${examplePath} from ${envPaths[0]}`)
        );
        process.exit(0);
      } catch (err) {
        console.error(chalk.red(`❌ Failed to generate .env.example:`), err);
        process.exit(1);
      }
    }

    // Load env files and merge
    const mergedEnvVars = loadEnvFiles(envPaths);

    // Load example file content
    let exampleContent: string;
    try {
      exampleContent = loadExampleFile(
        path.resolve(process.cwd(), options.example)
      );
    } catch (err) {
      console.error(chalk.red(`❌ Failed to read example file:`), err);
      process.exit(1);
      return;
    }

    // Parse example vars
    const exampleVars = dotenv.parse(exampleContent);

    // Check missing and extra vars
    const missing = Object.keys(exampleVars).filter(
      (key) => !(key in mergedEnvVars)
    );
    const extra = Object.keys(mergedEnvVars).filter(
      (key) => !(key in exampleVars)
    );

    if (options.json) {
      console.log(JSON.stringify({ missing, extra }, null, 2));
    } else {
      if (missing.length) {
        console.warn(
          chalk.yellow(`⚠️ Missing variables: ${missing.join(", ")}`)
        );
      }
      if (extra.length) {
        console.warn(chalk.yellow(`⚠️ Extra variables: ${extra.join(", ")}`));
      }
      if (!missing.length && !extra.length) {
        console.log(chalk.green("✅ All variables match!"));
      }
    }

    // Validate types
    const typeValidationResult = validateTypes(mergedEnvVars, exampleContent);
    if (typeValidationResult.errors.length) {
      typeValidationResult.errors.forEach((err: string) =>
        console.error(chalk.red(`❌ ${err}`))
      );
      if (options.ci) process.exit(1);
    } else {
      console.log(chalk.green("✅ All types/formats look good!"));
    }

    // Detect sensitive data
    const sensitiveWarnings = detectSensitive(mergedEnvVars);
    if (sensitiveWarnings.length) {
      sensitiveWarnings.forEach((warn) =>
        console.warn(chalk.yellow(`⚠️ ${warn}`))
      );
      if (options.ci) process.exit(1);
    }

    if (
      options.ci &&
      (missing.length ||
        extra.length ||
        typeValidationResult.errors.length ||
        sensitiveWarnings.length)
    ) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });

program.parse(process.argv);
