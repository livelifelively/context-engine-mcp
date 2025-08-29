import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

// Create wrapper functions that accept a workspace directory parameter
// This allows us to test the real filesystem operations without mocking process.cwd

const CONTEXT_ENGINE_DIR = ".context-engine";
const IMPLEMENTATION_DIR = "implementation";
const REQUIREMENTS_DIR = "requirements";
const CONFIG_DIR = "config";

interface DocumentationStatus {
  exists: boolean;
  structure: {
    implementation: boolean;
    requirements: boolean;
    config: boolean;
  };
  configFiles: {
    settings: boolean;
    workflows: boolean;
  };
}

interface SetupResult {
  success: boolean;
  message: string;
  status: DocumentationStatus;
}

/**
 * Check documentation structure in a specific directory
 */
async function checkDocumentationStructureInDir(
  workspaceDir: string
): Promise<DocumentationStatus> {
  const basePath = join(workspaceDir, CONTEXT_ENGINE_DIR);

  try {
    // Check if base directory exists
    const baseExists = await fs
      .access(basePath)
      .then(() => true)
      .catch(() => false);

    if (!baseExists) {
      return {
        exists: false,
        structure: {
          implementation: false,
          requirements: false,
          config: false,
        },
        configFiles: {
          settings: false,
          workflows: false,
        },
      };
    }

    // Check subdirectories
    const implementationPath = join(basePath, IMPLEMENTATION_DIR);
    const requirementsPath = join(basePath, REQUIREMENTS_DIR);
    const configPath = join(basePath, CONFIG_DIR);

    const implementationExists = await fs
      .access(implementationPath)
      .then(() => true)
      .catch(() => false);
    const requirementsExists = await fs
      .access(requirementsPath)
      .then(() => true)
      .catch(() => false);
    const configExists = await fs
      .access(configPath)
      .then(() => true)
      .catch(() => false);

    // Check config files
    const settingsPath = join(configPath, "settings.json");
    const workflowsPath = join(configPath, "workflows.json");

    const settingsExists = await fs
      .access(settingsPath)
      .then(() => true)
      .catch(() => false);
    const workflowsExists = await fs
      .access(workflowsPath)
      .then(() => true)
      .catch(() => false);

    return {
      exists: true,
      structure: {
        implementation: implementationExists,
        requirements: requirementsExists,
        config: configExists,
      },
      configFiles: {
        settings: settingsExists,
        workflows: workflowsExists,
      },
    };
  } catch {
    return {
      exists: false,
      structure: {
        implementation: false,
        requirements: false,
        config: false,
      },
      configFiles: {
        settings: false,
        workflows: false,
      },
    };
  }
}

/**
 * Create documentation structure in a specific directory
 */
async function createDocumentationStructureInDir(workspaceDir: string): Promise<void> {
  const basePath = join(workspaceDir, CONTEXT_ENGINE_DIR);

  // Create base directory
  await fs.mkdir(basePath, { recursive: true });

  // Create subdirectories
  const implementationPath = join(basePath, IMPLEMENTATION_DIR);
  const requirementsPath = join(basePath, REQUIREMENTS_DIR);
  const configPath = join(basePath, CONFIG_DIR);

  await Promise.all([
    fs.mkdir(implementationPath, { recursive: true }),
    fs.mkdir(requirementsPath, { recursive: true }),
    fs.mkdir(configPath, { recursive: true }),
  ]);
}

/**
 * Create default config files in a specific directory
 */
async function createDefaultConfigFilesInDir(workspaceDir: string): Promise<void> {
  const configPath = join(workspaceDir, CONTEXT_ENGINE_DIR, CONFIG_DIR);

  const defaultSettings = {
    version: "1.0.0",
    engine: {
      autoSetup: true,
      defaultWorkflow: "task-documentation",
    },
    documentation: {
      format: "markdown",
      autoSync: true,
    },
    created: new Date().toISOString(),
  };

  const defaultWorkflows = {
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
    created: new Date().toISOString(),
  };

  const settingsPath = join(configPath, "settings.json");
  const workflowsPath = join(configPath, "workflows.json");

  await Promise.all([
    fs.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2)),
    fs.writeFile(workflowsPath, JSON.stringify(defaultWorkflows, null, 2)),
  ]);
}

/**
 * Setup complete documentation structure in a specific directory
 */
async function setupDocumentationStructureInDir(workspaceDir: string): Promise<SetupResult> {
  try {
    const status = await checkDocumentationStructureInDir(workspaceDir);

    if (
      status.exists &&
      status.structure.implementation &&
      status.structure.requirements &&
      status.structure.config &&
      status.configFiles.settings &&
      status.configFiles.workflows
    ) {
      return {
        success: true,
        message: "Documentation structure already exists and is complete",
        status,
      };
    }

    // Create structure if it doesn't exist
    if (
      !status.exists ||
      !status.structure.implementation ||
      !status.structure.requirements ||
      !status.structure.config
    ) {
      await createDocumentationStructureInDir(workspaceDir);
    }

    // Create config files if they don't exist
    if (!status.configFiles.settings || !status.configFiles.workflows) {
      await createDefaultConfigFilesInDir(workspaceDir);
    }

    const finalStatus = await checkDocumentationStructureInDir(workspaceDir);

    return {
      success: true,
      message: "Documentation structure setup completed successfully",
      status: finalStatus,
    };
  } catch (error) {
    const errorStatus = await checkDocumentationStructureInDir(workspaceDir);
    return {
      success: false,
      message: `Failed to setup documentation structure: ${error}`,
      status: errorStatus,
    };
  }
}

/**
 * Isolated tests that run on the real filesystem in temporary directories
 * These tests verify actual directory creation and file operations
 * without interfering with the project's existing structure
 */
describe("Documentation Setup - Isolated Filesystem Tests", () => {
  let testWorkspaceDir: string;

  beforeEach(async () => {
    // Create a unique temporary directory for this test
    const testId = randomBytes(8).toString("hex");
    testWorkspaceDir = join(tmpdir(), `context-engine-test-${testId}`);

    // Create the test workspace directory
    await fs.mkdir(testWorkspaceDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testWorkspaceDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn(`Failed to cleanup test directory ${testWorkspaceDir}:`, error);
    }
  });

  describe("checkDocumentationStructure - Real Filesystem", () => {
    it("should return false when no .context-engine directory exists", async () => {
      const result = await checkDocumentationStructureInDir(testWorkspaceDir);

      expect(result).toEqual({
        exists: false,
        structure: {
          implementation: false,
          requirements: false,
          config: false,
        },
        configFiles: {
          settings: false,
          workflows: false,
        },
      });
    });

    it("should detect existing directory structure correctly", async () => {
      // Create the base directory and some subdirectories
      const baseDir = join(testWorkspaceDir, ".context-engine");
      const implementationDir = join(baseDir, "implementation");
      const configDir = join(baseDir, "config");

      await fs.mkdir(baseDir, { recursive: true });
      await fs.mkdir(implementationDir, { recursive: true });
      await fs.mkdir(configDir, { recursive: true });

      // Create one config file
      const settingsPath = join(configDir, "settings.json");
      await fs.writeFile(settingsPath, JSON.stringify({ test: true }));

      const result = await checkDocumentationStructureInDir(testWorkspaceDir);

      expect(result).toEqual({
        exists: true,
        structure: {
          implementation: true,
          requirements: false, // This one wasn't created
          config: true,
        },
        configFiles: {
          settings: true,
          workflows: false, // This one wasn't created
        },
      });
    });

    it("should detect complete structure with all files", async () => {
      // Create complete structure manually
      const baseDir = join(testWorkspaceDir, ".context-engine");
      const implementationDir = join(baseDir, "implementation");
      const requirementsDir = join(baseDir, "requirements");
      const configDir = join(baseDir, "config");

      await fs.mkdir(baseDir, { recursive: true });
      await fs.mkdir(implementationDir, { recursive: true });
      await fs.mkdir(requirementsDir, { recursive: true });
      await fs.mkdir(configDir, { recursive: true });

      // Create both config files
      const settingsPath = join(configDir, "settings.json");
      const workflowsPath = join(configDir, "workflows.json");
      await fs.writeFile(settingsPath, JSON.stringify({ test: true }));
      await fs.writeFile(workflowsPath, JSON.stringify({ test: true }));

      const result = await checkDocumentationStructureInDir(testWorkspaceDir);

      expect(result).toEqual({
        exists: true,
        structure: {
          implementation: true,
          requirements: true,
          config: true,
        },
        configFiles: {
          settings: true,
          workflows: true,
        },
      });
    });
  });

  describe("createDocumentationStructure - Real Filesystem", () => {
    it("should create the complete directory structure", async () => {
      await createDocumentationStructureInDir(testWorkspaceDir);

      // Verify directories were created
      const baseDir = join(testWorkspaceDir, ".context-engine");
      const implementationDir = join(baseDir, "implementation");
      const requirementsDir = join(baseDir, "requirements");
      const configDir = join(baseDir, "config");

      // Check if directories exist
      await expect(fs.access(baseDir)).resolves.toBeUndefined();
      await expect(fs.access(implementationDir)).resolves.toBeUndefined();
      await expect(fs.access(requirementsDir)).resolves.toBeUndefined();
      await expect(fs.access(configDir)).resolves.toBeUndefined();

      // Verify they are actually directories
      const baseStat = await fs.stat(baseDir);
      const implementationStat = await fs.stat(implementationDir);
      const requirementsStat = await fs.stat(requirementsDir);
      const configStat = await fs.stat(configDir);

      expect(baseStat.isDirectory()).toBe(true);
      expect(implementationStat.isDirectory()).toBe(true);
      expect(requirementsStat.isDirectory()).toBe(true);
      expect(configStat.isDirectory()).toBe(true);
    });

    it("should be idempotent - safe to run multiple times", async () => {
      // Run twice
      await createDocumentationStructureInDir(testWorkspaceDir);
      await createDocumentationStructureInDir(testWorkspaceDir);

      // Should still work and directories should exist
      const baseDir = join(testWorkspaceDir, ".context-engine");
      await expect(fs.access(baseDir)).resolves.toBeUndefined();
    });

    it("should handle permission errors gracefully", async () => {
      // Create a read-only directory to simulate permission issues
      const readOnlyDir = join(testWorkspaceDir, "readonly");
      await fs.mkdir(readOnlyDir, { mode: 0o444 });

      await expect(createDocumentationStructureInDir(readOnlyDir)).rejects.toThrow();
    });
  });

  describe("createDefaultConfigFiles - Real Filesystem", () => {
    beforeEach(async () => {
      // Create the required directory structure first
      await createDocumentationStructureInDir(testWorkspaceDir);
    });

    it("should create valid JSON configuration files", async () => {
      await createDefaultConfigFilesInDir(testWorkspaceDir);

      const configDir = join(testWorkspaceDir, ".context-engine", "config");
      const settingsPath = join(configDir, "settings.json");
      const workflowsPath = join(configDir, "workflows.json");

      // Verify files exist
      await expect(fs.access(settingsPath)).resolves.toBeUndefined();
      await expect(fs.access(workflowsPath)).resolves.toBeUndefined();

      // Verify file contents are valid JSON
      const settingsContent = await fs.readFile(settingsPath, "utf-8");
      const workflowsContent = await fs.readFile(workflowsPath, "utf-8");

      const settings = JSON.parse(settingsContent);
      const workflows = JSON.parse(workflowsContent);

      // Verify structure of settings.json
      expect(settings).toMatchObject({
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
      expect(settings.created).toBeDefined();
      expect(new Date(settings.created)).toBeInstanceOf(Date);

      // Verify structure of workflows.json
      expect(workflows).toMatchObject({
        version: "1.0.0",
        workflows: {
          "plan-documentation": {
            name: "Plan Documentation",
            enabled: true,
          },
          "task-documentation": {
            name: "Task Documentation",
            enabled: true,
          },
          "task-implementation": {
            name: "Task Implementation",
            enabled: true,
          },
        },
      });
      expect(workflows.created).toBeDefined();
      expect(new Date(workflows.created)).toBeInstanceOf(Date);
    });

    it("should be idempotent - safe to run multiple times", async () => {
      // Run twice
      await createDefaultConfigFilesInDir(testWorkspaceDir);
      const firstRun = await fs.readFile(
        join(testWorkspaceDir, ".context-engine", "config", "settings.json"),
        "utf-8"
      );

      await createDefaultConfigFilesInDir(testWorkspaceDir);
      const secondRun = await fs.readFile(
        join(testWorkspaceDir, ".context-engine", "config", "settings.json"),
        "utf-8"
      );

      // Files should be overwritten (different timestamps)
      const firstSettings = JSON.parse(firstRun);
      const secondSettings = JSON.parse(secondRun);

      expect(firstSettings.version).toBe(secondSettings.version);
      // Timestamps might be slightly different
    });
  });

  describe("setupDocumentationStructure - Real Filesystem", () => {
    it("should setup complete structure from scratch", async () => {
      const result = await setupDocumentationStructureInDir(testWorkspaceDir);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Documentation structure setup completed successfully");
      expect(result.status).toEqual({
        exists: true,
        structure: {
          implementation: true,
          requirements: true,
          config: true,
        },
        configFiles: {
          settings: true,
          workflows: true,
        },
      });

      // Verify actual files and directories exist
      const baseDir = join(testWorkspaceDir, ".context-engine");
      const settingsPath = join(baseDir, "config", "settings.json");
      const workflowsPath = join(baseDir, "config", "workflows.json");

      await expect(fs.access(baseDir)).resolves.toBeUndefined();
      await expect(fs.access(settingsPath)).resolves.toBeUndefined();
      await expect(fs.access(workflowsPath)).resolves.toBeUndefined();

      // Verify config files have valid content
      const settings = JSON.parse(await fs.readFile(settingsPath, "utf-8"));
      const workflows = JSON.parse(await fs.readFile(workflowsPath, "utf-8"));

      expect(settings.version).toBe("1.0.0");
      expect(workflows.version).toBe("1.0.0");
    });

    it("should detect existing complete structure and not recreate", async () => {
      // Setup once
      await setupDocumentationStructureInDir(testWorkspaceDir);

      // Get modification time of a config file
      const settingsPath = join(testWorkspaceDir, ".context-engine", "config", "settings.json");
      const originalStat = await fs.stat(settingsPath);

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Setup again
      const result = await setupDocumentationStructureInDir(testWorkspaceDir);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Documentation structure already exists and is complete");

      // Verify file wasn't modified (same mtime)
      const newStat = await fs.stat(settingsPath);
      expect(newStat.mtime).toEqual(originalStat.mtime);
    });

    it("should complete partial structure", async () => {
      // Create partial structure - only base directory and implementation folder
      const baseDir = join(testWorkspaceDir, ".context-engine");
      const implementationDir = join(baseDir, "implementation");

      await fs.mkdir(baseDir, { recursive: true });
      await fs.mkdir(implementationDir, { recursive: true });

      const result = await setupDocumentationStructureInDir(testWorkspaceDir);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Documentation structure setup completed successfully");
      expect(result.status).toEqual({
        exists: true,
        structure: {
          implementation: true,
          requirements: true,
          config: true,
        },
        configFiles: {
          settings: true,
          workflows: true,
        },
      });

      // Verify missing parts were created
      const requirementsDir = join(baseDir, "requirements");
      const configDir = join(baseDir, "config");
      const settingsPath = join(configDir, "settings.json");

      await expect(fs.access(requirementsDir)).resolves.toBeUndefined();
      await expect(fs.access(configDir)).resolves.toBeUndefined();
      await expect(fs.access(settingsPath)).resolves.toBeUndefined();
    });

    it("should handle and report errors properly", async () => {
      // Create a scenario where we can't write (read-only filesystem simulation)
      const readOnlyDir = join(testWorkspaceDir, "readonly");
      await fs.mkdir(readOnlyDir, { mode: 0o444 });

      const result = await setupDocumentationStructureInDir(readOnlyDir);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to setup documentation structure");
      expect(result.status.exists).toBe(false);
    });
  });

  describe("Directory Structure Validation", () => {
    it("should create correct directory hierarchy", async () => {
      await setupDocumentationStructureInDir(testWorkspaceDir);

      const baseDir = join(testWorkspaceDir, ".context-engine");

      // Read directory contents to verify structure
      const baseDirContents = await fs.readdir(baseDir);
      expect(baseDirContents.sort()).toEqual(["config", "implementation", "requirements"]);

      const configDirContents = await fs.readdir(join(baseDir, "config"));
      expect(configDirContents.sort()).toEqual(["settings.json", "workflows.json"]);

      // Verify subdirectories are empty initially
      const implementationContents = await fs.readdir(join(baseDir, "implementation"));
      const requirementsContents = await fs.readdir(join(baseDir, "requirements"));

      expect(implementationContents).toEqual([]);
      expect(requirementsContents).toEqual([]);
    });

    it("should handle concurrent operations safely", async () => {
      // Run multiple setup operations concurrently
      const promises = Array(5)
        .fill(null)
        .map(() => setupDocumentationStructureInDir(testWorkspaceDir));

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Structure should be intact
      const finalStatus = await checkDocumentationStructureInDir(testWorkspaceDir);
      expect(finalStatus.exists).toBe(true);
      expect(finalStatus.structure).toEqual({
        implementation: true,
        requirements: true,
        config: true,
      });
      expect(finalStatus.configFiles).toEqual({
        settings: true,
        workflows: true,
      });
    });
  });
});
