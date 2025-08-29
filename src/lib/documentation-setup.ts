import { promises as fs } from "fs";
import { join } from "path";
import { cwd } from "process";
import { logger } from "./logger.js";

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
 * Checks if the ContextEngine documentation structure exists
 */
export async function checkDocumentationStructure(
  projectRoot?: string
): Promise<DocumentationStatus> {
  const basePath = join(projectRoot || cwd(), CONTEXT_ENGINE_DIR);

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
  } catch (error) {
    logger.error("Error checking documentation structure", {
      error: error instanceof Error ? error.message : String(error),
    });
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
 * Creates the ContextEngine documentation structure
 */
export async function createDocumentationStructure(projectRoot?: string): Promise<void> {
  const basePath = join(projectRoot || cwd(), CONTEXT_ENGINE_DIR);

  try {
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

    logger.info("ContextEngine documentation structure created successfully");
  } catch (error) {
    logger.error("Error creating documentation structure", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Failed to create documentation structure: ${error}`);
  }
}

/**
 * Creates default configuration files
 */
export async function createDefaultConfigFiles(projectRoot?: string): Promise<void> {
  const configPath = join(projectRoot || cwd(), CONTEXT_ENGINE_DIR, CONFIG_DIR);

  try {
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

    logger.info("Default configuration files created successfully");
  } catch (error) {
    logger.error("Error creating default config files", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Failed to create default config files: ${error}`);
  }
}

/**
 * Sets up the complete documentation structure if it doesn't exist
 */
export async function setupDocumentationStructure(projectRoot: string): Promise<SetupResult> {
  if (!projectRoot) {
    throw new Error("Project root directory is required for documentation structure setup");
  }

  try {
    logger.info("Setting up documentation structure", { projectRoot });

    const status = await checkDocumentationStructure(projectRoot);

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
      await createDocumentationStructure(projectRoot);
    }

    // Create config files if they don't exist
    if (!status.configFiles.settings || !status.configFiles.workflows) {
      await createDefaultConfigFiles(projectRoot);
    }

    const finalStatus = await checkDocumentationStructure(projectRoot);

    return {
      success: true,
      message: "Documentation structure setup completed successfully",
      status: finalStatus,
    };
  } catch (error) {
    logger.error("Error in setupDocumentationStructure", {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorStatus = await checkDocumentationStructure(projectRoot);
    
    return {
      success: false,
      message: `Failed to setup documentation structure: ${error}`,
      status: errorStatus,
    };
  }
}
