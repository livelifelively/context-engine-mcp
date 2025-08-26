import { generateHeaders } from "./encryption.js";
import { ProxyAgent, setGlobalDispatcher } from "undici";

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
    console.error(
      `[ContextEngine] Failed to configure proxy agent for provided proxy URL: ${PROXY_URL}:`,
      error
    );
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
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  return response;
}

/**
 * Greet function to test basic API connectivity with a personalized message
 * @param name Optional name to include in the greeting
 * @param clientIp Optional client IP address to include in headers
 * @param apiKey Optional API key for authentication
 * @param serverUrl Optional server URL override
 * @returns Greeting message or error message
 */
export async function greet(
  name?: string,
  clientIp?: string,
  apiKey?: string,
  serverUrl?: string
): Promise<string> {
  try {
    const params: Record<string, string> = {};
    if (name) params.name = name;
    
    const url = buildApiUrl("greet", params, serverUrl);
    const headers = generateHeaders(clientIp, apiKey, { "X-ContextEngine-Source": "mcp-server" });
    
    const response = await makeApiRequest(url, headers, "send greeting");
    const text = await response.text();
    
    if (!text || text === "No content available") {
      return "Hello! API is working but no greeting content available.";
    }
    
    return text;
  } catch (error) {
    console.error("Greeting API call failed:", error);
    throw new Error(`Failed to send greeting: ${error}`);
  }
}
