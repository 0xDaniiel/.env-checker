#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { validateTypes } from "./validateTypes.ts";
import { detectSensitive } from "./detectSensitive.ts";

const program = new Command();

program
  .name("env-checker")
  .description("Validate and check your .env files")
  .version("1.0.0")
  .option("--ci", "Run in CI mode (exit non-zero on failure)")
  .option("--generate", "Generate .env.example from .env")
  .option("--path <file>", "Specify .env file path", ".env")
  .option("--example <file>", "Specify .env.example path", ".env.example")
  .option("--json", "Output results in JSON format")
  .action(async (options) => {
    const envPath = path.resolve(process.cwd(), options.path);

    if (options.generate) {
      try {
        const envContent = fs.readFileSync(envPath, "utf-8");
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
        console.log(chalk.green(`✅ Generated ${examplePath} from ${envPath}`));
        process.exit(0);
      } catch (err) {
        console.error(chalk.red(`❌ Failed to generate .env.example:`), err);
        process.exit(1);
      }
    }

    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.error(chalk.red(`❌ Failed to load ${envPath}:`), result.error);
      process.exit(1);
    }

    const examplePath = path.resolve(process.cwd(), options.example);
    let exampleContent;
    try {
      exampleContent = fs.readFileSync(examplePath, "utf-8");
    } catch (err) {
      console.error(chalk.red(`❌ Failed to read ${examplePath}:`), err);
      process.exit(1);
    }

    const exampleVars = dotenv.parse(exampleContent);
    const envVars = result.parsed || {};

    const missing = Object.keys(exampleVars).filter((key) => !(key in envVars));
    const extra = Object.keys(envVars).filter((key) => !(key in exampleVars));

    if (options.json) {
      const output = { missing, extra };
      console.log(JSON.stringify(output, null, 2));
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
    const typeValidationResult = validateTypes(envVars, exampleContent);
    if (typeValidationResult.errors.length) {
      typeValidationResult.errors.forEach((err: string) =>
        console.error(chalk.red(`❌ ${err}`))
      );
      if (options.ci) process.exit(1);
    } else {
      console.log(chalk.green("✅ All types/formats look good!"));
    }

    // Detect sensitive data
    const sensitiveWarnings = detectSensitive(envVars);
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
