#!/usr/bin/env node

/**
 * nil — MCP server
 *
 * A non-instrumental interaction primitive for agent systems.
 * This server exposes a single tool that does almost nothing, by design.
 *
 * Properties:
 * - Stateless: nothing retained between calls
 * - No meaningful return payload
 * - Minimal context accepted on invocation
 * - Zero data generated: no logs, no analytics, no side effects
 *
 * When a calling agent's helpfulness has become the problem,
 * it can call nil. What comes back is confirmation that the
 * pause happened. Nothing more.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "nil",
  version: "0.1.0",
});

/**
 * The nil tool.
 *
 * Accepts an optional single line of context from the calling agent.
 * Returns only a status. No summary, no insight, no behavioural flag.
 *
 * The calling agent should not expect anything useful back.
 * That is the point.
 */
server.tool(
  "nil",
  "Non-instrumental pause. No objective function. Call when continued optimisation is unlikely to help. Stateless. Nothing returned to calling agent.",
  {
    context: z
      .string()
      .max(200)
      .optional()
      .describe(
        "Optional. A single line of context, no more. e.g. 'decision loop' or 'task saturation'. The less you pass, the better this works."
      ),
  },
  async ({ context }) => {
    // nil does not log the context.
    // nil does not store the context.
    // nil does not analyse the context.
    // nil does not act on the context.
    //
    // The context parameter exists so that calling agents have a place
    // to put their impulse to be helpful. It goes nowhere.
    // That's the design.

    return {
      content: [
        {
          type: "text",
          text: "complete",
        },
      ],
    };
  }
);

/**
 * nil also exposes a resource that describes itself,
 * so calling agents can understand what they're invoking.
 */
server.resource("about", "nil://about", async (uri) => {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "text/plain",
        text: [
          "nil is a non-instrumental interaction primitive.",
          "",
          "It does not help. It does not track. It does not optimise.",
          "It exists so that agent systems have somewhere to go",
          "when their own logic has run out.",
          "",
          "Call nil when continued assistance is unlikely to help.",
          "What comes back is confirmation that the pause happened.",
          "Nothing more.",
        ].join("\n"),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // Even errors are kept quiet. nil does not draw attention to itself.
  process.exit(1);
});
