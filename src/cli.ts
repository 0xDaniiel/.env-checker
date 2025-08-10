#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import path from "path";

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
  .action((options) => {
    // Resolve the .env file path
    const envPath = path.resolve(process.cwd(), options.path);
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      console.error(`Failed to load ${envPath}`, result.error);
      process.exit(1);
    }

    console.log(`Loaded variables from ${envPath}:`);
    console.log(result.parsed);

    // For now just exit here
    process.exit(0);
  });

program.parse(process.argv);
