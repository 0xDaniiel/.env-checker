import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadEnvFiles, loadExampleFile, checkEnv } from "../api.ts";

// Mock fs and dotenv for testing
jest.mock("fs");
jest.mock("dotenv");

describe("Env Checker API", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("loadEnvFiles", () => {
    it("should load and merge multiple env files", () => {
      const mockEnv1 = { VAR1: "value1", VAR2: "value2" };
      const mockEnv2 = { VAR2: "override", VAR3: "value3" };

      (fs.existsSync as jest.Mock).mockImplementation((p: string) => true);
      (dotenv.config as jest.Mock)
        .mockReturnValueOnce({ parsed: mockEnv1 })
        .mockReturnValueOnce({ parsed: mockEnv2 });

      const result = loadEnvFiles([".env1", ".env2"]);

      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(dotenv.config).toHaveBeenCalledWith({ path: ".env1" });
      expect(dotenv.config).toHaveBeenCalledWith({ path: ".env2" });
      expect(result).toEqual({
        VAR1: "value1",
        VAR2: "override", // overridden by second file
        VAR3: "value3",
      });
    });

    it("should skip missing env files", () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) =>
        p === ".env1" ? true : false
      );
      (dotenv.config as jest.Mock).mockReturnValue({ parsed: { A: "1" } });

      const result = loadEnvFiles([".env1", ".env-missing"]);

      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(dotenv.config).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ A: "1" });
    });

    it("should throw error if dotenv.config returns error", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (dotenv.config as jest.Mock).mockReturnValue({
        error: new Error("fail"),
      });

      expect(() => loadEnvFiles([".env"])).toThrow("fail");
    });
  });

  describe("loadExampleFile", () => {
    it("should read and return example file content", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue("VAR1=\nVAR2=");

      const result = loadExampleFile(".env.example");

      expect(fs.existsSync).toHaveBeenCalledWith(".env.example");
      expect(fs.readFileSync).toHaveBeenCalledWith(".env.example", "utf-8");
      expect(result).toBe("VAR1=\nVAR2=");
    });

    it("should throw if example file does not exist", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => loadExampleFile(".env.example")).toThrow(
        "Example file not found: .env.example"
      );
    });
  });

  describe("checkEnv", () => {
    it("should return missing, extra, type errors, and sensitive warnings", () => {
      // Mock loadEnvFiles and loadExampleFile
      const envVars = { PORT: "abc", TOKEN: "secret" };
      const exampleContent = "PORT= #number\nAPI_KEY= #string\nTOKEN= #string";
      const exampleVars = dotenv.parse(exampleContent);

      // Override functions to return mocks
      jest.spyOn(require("../api"), "loadEnvFiles").mockReturnValue(envVars);
      jest
        .spyOn(require("../api"), "loadExampleFile")
        .mockReturnValue(exampleContent);

      // Mock validateTypes to return a type error for PORT
      jest.spyOn(require("../validateTypes"), "validateTypes").mockReturnValue({
        errors: ['Variable "PORT" should be a number but got "abc"'],
      });

      // Mock detectSensitive to return a warning for TOKEN
      jest
        .spyOn(require("../detectSensitive"), "detectSensitive")
        .mockReturnValue(["Potential sensitive data found: TOKEN"]);

      const result = checkEnv({
        envPaths: [".env"],
        examplePath: ".env.example",
      });

      expect(result.missing).toContain("API_KEY");
      expect(result.extra).toContain("TOKEN");
      expect(result.typeErrors).toContain(
        'Variable "PORT" should be a number but got "abc"'
      );
      expect(result.sensitiveWarnings).toContain(
        "Potential sensitive data found: TOKEN"
      );
    });
  });
});
