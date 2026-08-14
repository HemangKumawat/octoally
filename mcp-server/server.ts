#!/usr/bin/env node
/**
 * OctoAlly MCP server
 *
 * Stdio MCP server exposing live OctoAlly terminal/session data by proxying
 * the OctoAlly HTTP API on 127.0.0.1. Runs directly under node >= 22.18
 * (native TypeScript type stripping) — no build step, no bun.
 *
 * With .mcp.json:
 *   { "octoally": { "command": "node", "args": ["/home/hemang/octoally/mcp-server/server.ts"] } }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const port = process.env.OCTOALLY_PORT || "42010";
const baseUrl = `http://127.0.0.1:${port}`;

function textResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    ...(isError ? { isError: true as const } : {}),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readSessionId(
  args: Record<string, unknown> | undefined,
): string | null {
  const value = args?.sessionId;
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

async function fetchJson(path: string): Promise<unknown> {
  const url = `${baseUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      `OctoAlly server not reachable at ${baseUrl} — is it running?`,
    );
  }

  if (!response.ok) {
    throw new Error(`OctoAlly returned HTTP ${response.status} for ${url}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`OctoAlly returned invalid JSON for ${url}`);
  }
}

async function fetchTerminals(): Promise<unknown[]> {
  const payload = await fetchJson("/api/terminals");

  if (!Array.isArray(payload)) {
    throw new Error("OctoAlly returned an invalid terminal list");
  }

  return payload;
}

const server = new Server(
  {
    name: "octoally-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_terminals",
      description:
        "List every live OctoAlly terminal and its current session state (process state + meta task).",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "get_terminal",
      description:
        "Get one OctoAlly terminal and its current live session state.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            minLength: 1,
            description: "OctoAlly session ID",
          },
        },
        required: ["sessionId"],
        additionalProperties: false,
      },
    },
    {
      name: "get_terminal_output",
      description:
        "Get the recent ANSI-stripped output tail for an OctoAlly terminal.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            minLength: 1,
            description: "OctoAlly session ID",
          },
          lines: {
            type: "integer",
            minimum: 1,
            maximum: 2000,
            default: 200,
            description: "Number of recent output lines",
          },
        },
        required: ["sessionId"],
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "list_terminals": {
        const terminals = await fetchTerminals();
        return textResult(JSON.stringify(terminals, null, 2));
      }

      case "get_terminal": {
        const sessionId = readSessionId(request.params.arguments);
        if (!sessionId) {
          return textResult(
            "sessionId is required and must be a non-empty string",
            true,
          );
        }

        const terminals = await fetchTerminals();
        const terminal = terminals.find(
          (candidate) =>
            typeof candidate === "object" &&
            candidate !== null &&
            (candidate as { id?: unknown }).id === sessionId,
        );

        if (!terminal) {
          return textResult(`Terminal "${sessionId}" not found (404)`, true);
        }

        return textResult(JSON.stringify(terminal, null, 2));
      }

      case "get_terminal_output": {
        const args = request.params.arguments;
        const sessionId = readSessionId(args);
        if (!sessionId) {
          return textResult(
            "sessionId is required and must be a non-empty string",
            true,
          );
        }

        let lines = 200;
        if (args?.lines !== undefined) {
          if (
            typeof args.lines !== "number" ||
            !Number.isSafeInteger(args.lines) ||
            args.lines < 1 ||
            args.lines > 2000
          ) {
            return textResult(
              "lines must be an integer between 1 and 2000",
              true,
            );
          }

          lines = args.lines;
        }

        const payload = await fetchJson(
          `/api/terminals/${encodeURIComponent(sessionId)}/output?lines=${lines}`,
        );
        const output =
          typeof payload === "object" && payload !== null
            ? (payload as { output?: unknown }).output
            : undefined;

        if (typeof output !== "string") {
          throw new Error("OctoAlly returned an invalid output response");
        }

        return textResult(output);
      }

      default:
        return textResult(`Unknown tool: ${request.params.name}`, true);
    }
  } catch (error) {
    return textResult(errorMessage(error), true);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
