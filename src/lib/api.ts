import { SearchResponse } from "./types.js";
import { generateHeaders } from "./encryption.js";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const DEFAULT_CONTEXT_ENGINE_API_BASE_URL = "https://contextengine.in";
const DEFAULT_TYPE = "txt";

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
  const url = new URL(`${baseUrl}/api/v1/${endpoint}`);
  
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
      return "The library you are trying to access does not exist. Please try with a different library ID.";
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
 * Searches for libraries matching the given query
 * @param query The search query
 * @param clientIp Optional client IP address to include in headers
 * @param apiKey Optional API key for authentication
 * @returns Search results or null if the request fails
 */
export async function searchLibraries(
  query: string,
  clientIp?: string,
  apiKey?: string,
  serverUrl?: string
): Promise<SearchResponse> {
  try {
    const url = buildApiUrl("search", { query }, serverUrl);
    const headers = generateHeaders(clientIp, apiKey);
    
    const response = await makeApiRequest(url, headers, "search libraries");
    return await response.json();
  } catch (error) {
    console.error("Error searching libraries:", error);
    return { 
      results: [], 
      error: `Error searching libraries: ${error}` 
    } as SearchResponse;
  }
}

/**
 * Fetches documentation context for a specific library
 * @param libraryId The library ID to fetch documentation for
 * @param options Options for the request
 * @param clientIp Optional client IP address to include in headers
 * @param apiKey Optional API key for authentication
 * @returns The documentation text or null if the request fails
 */
export async function fetchLibraryDocumentation(
  libraryId: string,
  options: {
    tokens?: number;
    topic?: string;
  } = {},
  clientIp?: string,
  apiKey?: string,
  serverUrl?: string
): Promise<string | null> {
  try {
    if (libraryId.startsWith("/")) {
      libraryId = libraryId.slice(1);
    }
    
    const params: Record<string, string> = { type: DEFAULT_TYPE };
    if (options.tokens) params.tokens = options.tokens.toString();
    if (options.topic) params.topic = options.topic;
    
    const url = buildApiUrl(libraryId, params, serverUrl);
    const headers = generateHeaders(clientIp, apiKey, { "X-ContextEngine-Source": "mcp-server" });
    
    const response = await makeApiRequest(url, headers, "fetch documentation");
    const text = await response.text();
    
    if (!text || text === "No content available" || text === "No context data available") {
      return null;
    }
    
    return text;
  } catch (error) {
    const errorMessage = `Error fetching library documentation. Please try again later. ${error}`;
    console.error(errorMessage);
    return errorMessage;
  }
}

/**
 * Health check function to verify API connectivity and status
 * @param clientIp Optional client IP address to include in headers
 * @param apiKey Optional API key for authentication
 * @param serverUrl Optional server URL override
 * @returns Health status information or error message
 */
export async function checkHealth(
  clientIp?: string,
  apiKey?: string,
  serverUrl?: string
): Promise<{ status: string; timestamp: string; version?: string } | string> {
  try {
    const url = buildApiUrl("health", {}, serverUrl);
    const headers = generateHeaders(clientIp, apiKey, { "X-ContextEngine-Source": "mcp-server" });
    
    const response = await makeApiRequest(url, headers, "check health");
    return await response.json();
  } catch (error) {
    const errorMessage = `Health check failed: ${error}`;
    console.error(errorMessage);
    return errorMessage;
  }
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
    const errorMessage = `Greeting failed: ${error}`;
    console.error(errorMessage);
    return errorMessage;
  }
}
