import { generateHeaders } from "./encryption.js";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { setupDocumentationStructure } from "./documentation-setup.js";
import { logger } from "./logger.js";

const DEFAULT_CONTEXT_ENGINE_API_BASE_URL = "https://contextengine.in";

// Pick up proxy configuration in a variety of common env var names.
const PROXY_URL: string | null =
  process.env.HTTPS_PROXY ??
  process.env.https_proxy ??
  process.env.HTTP_PROXY ??
  process.env.http_proxy ??
  null;

if (PROXY_URL && !PROXY_URL.startsWith("$") && /^(http|https):\/\//i.test(PROXY_URL)) {
  try {
    // Configure a global proxy agent once at startup. Subsequent fetch calls will
    // automatically use this dispatcher.
    // Using `any` cast because ProxyAgent implements the Dispatcher interface but
    // TS may not infer it correctly in some versions.
    setGlobalDispatcher(new ProxyAgent(PROXY_URL));
  } catch (error) {
    // Don't crash the app if proxy initialisation fails – just log a warning.
    logger.error("Failed to configure proxy agent", {
      proxyUrl: PROXY_URL,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Builds an API URL with the given endpoint and parameters
 */
function buildApiUrl(endpoint: string, params: Record<string, string>, serverUrl?: string): URL {
  const baseUrl = serverUrl || DEFAULT_CONTEXT_ENGINE_API_BASE_URL;
  const url = new URL(`${baseUrl}/api/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return url;
}

/**
 * Handles common API response errors and returns appropriate error messages
 */
function handleApiError(response: Response, operation: string): string {
  const errorCode = response.status;

  switch (errorCode) {
    case 429:
      return "Rate limited due to too many requests. Please try again later.";
    case 401:
      return "Unauthorized. Please check your API key.";
    case 404:
      return "API endpoint not found. Please check the server URL and endpoint path.";
    default:
      return `Failed to ${operation}. Please try again later. Error code: ${errorCode}`;
  }
}

/**
 * Makes an API request with common error handling
 */
async function makeApiRequest(
  url: URL,
  headers: HeadersInit,
  operation: string
): Promise<Response> {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorMessage = handleApiError(response, operation);
    logger.error("API request failed", { operation, errorMessage });
    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Start context engine function to initiate the context engine service
 * @param projectRoot Required project root directory
 * @param clientIp Optional client IP address to include in headers
 * @param apiKey Optional API key for authentication
 * @param serverUrl Optional server URL override
 * @returns Combined status message including API response and local setup status
 */
export async function startContextEngine(
  projectRoot: string,
  clientIp?: string,
  apiKey?: string,
  serverUrl?: string
): Promise<string> {
  if (!projectRoot) {
    throw new Error("Project root directory is required for context engine initialization");
  }

  let apiResponse = "";
  let documentationStatus = "";

  try {
    // Step 1: Setup local documentation structure first
    logger.info("Setting up local documentation structure");
    const setupResult = await setupDocumentationStructure(projectRoot);

    if (setupResult.success) {
      documentationStatus = `\n\n📁 Local Documentation Structure: ${setupResult.message}`;
      logger.info("Local documentation structure setup completed", {
        status: setupResult.status as unknown as Record<string, unknown>,
      });
    } else {
      logger.warn("Local documentation structure setup failed", {
        status: setupResult.status as unknown as Record<string, unknown>,
      });
      // Don't proceed with API call if local setup fails
      return `❌ Failed to setup local documentation structure: ${setupResult.message}`;
    }
  } catch (error) {
    logger.error("Local documentation structure setup failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't proceed with API call if local setup fails
    return `❌ Failed to setup local documentation structure: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    // Step 2: Start the context engine via API (only if local setup succeeded)
    logger.info("Starting ContextEngine via API");
    const url = buildApiUrl("start-context-engine", {}, serverUrl);
    const headers = generateHeaders(clientIp, apiKey, { "X-ContextEngine-Source": "mcp-server" });

    const response = await makeApiRequest(url, headers, "start context engine");
    const text = await response.text();

    if (!text || text === "No content available") {
      apiResponse = "Context engine start request sent but no confirmation available.";
    } else {
      apiResponse = text;
    }

    logger.info("ContextEngine API call successful");
  } catch (error) {
    logger.error("ContextEngine API call failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    apiResponse = `⚠️  ContextEngine API call failed: ${error instanceof Error ? error.message : String(error)}`;
  }
  
  // Return combined response
  return `${apiResponse}${documentationStatus}`;
}
