import { describe, it, expect, beforeEach, vi } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import {
  checkDocumentationStructure,
  createDocumentationStructure,
  createDefaultConfigFiles,
  setupDocumentationStructure,
} from "../../src/lib/documentation-setup.js";

// Mock fs module
vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Mock process.cwd
vi.mock("process", () => ({
  cwd: vi.fn(() => "/test/workspace"),
}));

const mockFs = vi.mocked(fs);

describe("Documentation Setup Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("checkDocumentationStructure", () => {
    it("should return false when base directory does not exist", async () => {
      mockFs.access.mockRejectedValueOnce(new Error("ENOENT"));

      const result = await checkDocumentationStructure();

      expect(result).toEqual({
        exists: false,
        structure: {
          implemented: false,
          requirements: false,
          config: false,
        },
        configFiles: {
          settings: false,
          workflows: false,
        },
      });
    });

    it("should return true when all directories and files exist", async () => {
      // Mock successful access for all paths
      mockFs.access.mockResolvedValue(undefined);

      const result = await checkDocumentationStructure();

      expect(result).toEqual({
        exists: true,
        structure: {
          implemented: true,
          requirements: true,
          config: true,
        },
        configFiles: {
          settings: true,
          workflows: true,
        },
      });
    });

    it("should return partial structure when some directories exist", async () => {
      // Mock base directory exists
      mockFs.access
        .mockResolvedValueOnce(undefined) // base directory
        .mockResolvedValueOnce(undefined) // implemented
        .mockRejectedValueOnce(new Error("ENOENT")) // requirements
        .mockResolvedValueOnce(undefined) // config
        .mockResolvedValueOnce(undefined) // settings.json
        .mockRejectedValueOnce(new Error("ENOENT")); // workflows.json

      const result = await checkDocumentationStructure();

      expect(result).toEqual({
        exists: true,
        structure: {
          implemented: true,
          requirements: false,
          config: true,
        },
        configFiles: {
          settings: true,
          workflows: false,
        },
      });
    });

    it("should handle errors gracefully", async () => {
      mockFs.access.mockRejectedValue(new Error("Permission denied"));

      const result = await checkDocumentationStructure();

      expect(result).toEqual({
        exists: false,
        structure: {
          implemented: false,
          requirements: false,
          config: false,
        },
        configFiles: {
          settings: false,
          workflows: false,
        },
      });
    });
  });

  describe("createDocumentationStructure", () => {
    it("should create all directories successfully", async () => {
      mockFs.mkdir.mockResolvedValue(undefined);

      await createDocumentationStructure();

      expect(mockFs.mkdir).toHaveBeenCalledTimes(4); // base + 3 subdirectories
      expect(mockFs.mkdir).toHaveBeenCalledWith(join("/test/workspace", ".context-engine"), {
        recursive: true,
      });
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        join("/test/workspace", ".context-engine", "implemented"),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        join("/test/workspace", ".context-engine", "requirements"),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        join("/test/workspace", ".context-engine", "config"),
        { recursive: true }
      );
    });

    it("should throw error when directory creation fails", async () => {
      mockFs.mkdir.mockRejectedValue(new Error("Permission denied"));

      await expect(createDocumentationStructure()).rejects.toThrow(
        "Failed to create documentation structure: Error: Permission denied"
      );
    });
  });

  describe("createDefaultConfigFiles", () => {
    it("should create settings.json and workflows.json with default content", async () => {
      mockFs.writeFile.mockResolvedValue(undefined);

      await createDefaultConfigFiles();

      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);

      // Check settings.json call
      const settingsCall = mockFs.writeFile.mock.calls[0];
      expect(settingsCall[0]).toBe(
        join("/test/workspace", ".context-engine", "config", "settings.json")
      );

      const settingsContent = JSON.parse(settingsCall[1] as string);
      expect(settingsContent).toMatchObject({
        version: "1.0.0",
        engine: {
          autoSetup: true,
          defaultWorkflow: "task-documentation",
        },
        documentation: {
          format: "markdown",
          autoSync: true,
        },
      });
      expect(settingsContent.created).toBeDefined();

      // Check workflows.json call
      const workflowsCall = mockFs.writeFile.mock.calls[1];
      expect(workflowsCall[0]).toBe(
        join("/test/workspace", ".context-engine", "config", "workflows.json")
      );

      const workflowsContent = JSON.parse(workflowsCall[1] as string);
      expect(workflowsContent).toMatchObject({
        version: "1.0.0",
        workflows: {
          "plan-documentation": {
            name: "Plan Documentation",
            description:
              "Create comprehensive strategic documentation for projects or major components",
            enabled: true,
          },
          "task-documentation": {
            name: "Task Documentation",
            description: "Create detailed implementation specifications for specific work items",
            enabled: true,
          },
          "task-implementation": {
            name: "Task Implementation",
            description:
              "Transform documented requirements into working code following test-driven development",
            enabled: true,
          },
        },
      });
      expect(workflowsContent.created).toBeDefined();
    });

    it("should throw error when file creation fails", async () => {
      mockFs.writeFile.mockRejectedValue(new Error("Disk full"));

      await expect(createDefaultConfigFiles()).rejects.toThrow(
        "Failed to create default config files: Error: Disk full"
      );
    });
  });

  describe("setupDocumentationStructure", () => {
    it("should return success when structure already exists and is complete", async () => {
      // Mock that everything exists
      mockFs.access.mockResolvedValue(undefined);

      const result = await setupDocumentationStructure();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Documentation structure already exists and is complete");
      expect(result.status).toEqual({
        exists: true,
        structure: {
          implemented: true,
          requirements: true,
          config: true,
        },
        configFiles: {
          settings: true,
          workflows: true,
        },
      });
    });

    it("should create missing structure and return success", async () => {
      // Mock that base exists but subdirectories don't
      mockFs.access
        .mockResolvedValueOnce(undefined) // base directory
        .mockRejectedValueOnce(new Error("ENOENT")) // implemented
        .mockRejectedValueOnce(new Error("ENOENT")) // requirements
        .mockRejectedValueOnce(new Error("ENOENT")) // config
        .mockRejectedValueOnce(new Error("ENOENT")) // settings.json
        .mockRejectedValueOnce(new Error("ENOENT")); // workflows.json

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await setupDocumentationStructure();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Documentation structure setup completed successfully");
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it("should handle errors and return failure status", async () => {
      // Mock that base directory doesn't exist, but mkdir fails
      mockFs.access.mockRejectedValue(new Error("ENOENT"));
      mockFs.mkdir.mockRejectedValue(new Error("Permission denied"));

      const result = await setupDocumentationStructure();

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to setup documentation structure");
      expect(result.status).toEqual({
        exists: false,
        structure: {
          implemented: false,
          requirements: false,
          config: false,
        },
        configFiles: {
          settings: false,
          workflows: false,
        },
      });
    });
  });
});
