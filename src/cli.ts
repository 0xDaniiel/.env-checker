#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import fs from "fs";
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
    const envPath = path.resolve(process.cwd(), options.path);

    // If --generate, read .env and write .env.example, then exit
    if (options.generate) {
      try {
        const envContent = fs.readFileSync(envPath, "utf-8");
        // Strip secrets (basic: remove values, keep keys)
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
        console.log(`Generated ${examplePath} from ${envPath}`);
        process.exit(0);
      } catch (err) {
        console.error(`Failed to generate .env.example:`, err);
        process.exit(1);
      }
    }

    // Normal check flow
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.error(`Failed to load ${envPath}`, result.error);
      process.exit(1);
    }

    const examplePath = path.resolve(process.cwd(), options.example);
    let exampleContent;
    try {
      exampleContent = fs.readFileSync(examplePath, "utf-8");
    } catch (err) {
      console.error(`Failed to read ${examplePath}`, err);
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
        console.warn("Missing variables:", missing.join(", "));
      }
      if (extra.length) {
        console.warn("Extra variables:", extra.join(", "));
      }
      if (!missing.length && !extra.length) {
        console.log("All variables match!");
      }
    }

    if (options.ci && (missing.length || extra.length)) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });

program.parse(process.argv);
