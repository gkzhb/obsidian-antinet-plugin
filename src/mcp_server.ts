/* eslint-disable @typescript-eslint/no-unused-vars */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { App } from "obsidian";

import { listTreeRootMainCard, readMainCardTool } from "./antinet/main_card";
import { registerTool } from "./mcps";

export const createServer = (app: App) => {
	// Create server instance
	const server = new McpServer({
		name: "Obsidian Antinet Zettelkasten",
		version: "1.0.0",
	});

	// Register tools
	[readMainCardTool, listTreeRootMainCard].forEach((getTool) => {
		const tool = getTool({ app, server });
		registerTool(server, tool);
	});

	return { server };
};
