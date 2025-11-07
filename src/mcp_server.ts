/* eslint-disable @typescript-eslint/no-unused-vars */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { App } from "obsidian";

import { listTreeRootMainCard, readMainCardTool } from "./antinet/main_card";
import { getSessionStatsTool, cleanupSessionsTool } from "./antinet/session_tools";
import { registerTool } from "./mcps";
import { SessionManager } from "./session_manager";

export interface ServerContext {
	app: App;
	server: McpServer;
}

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

/**
 * Create a new server instance for a specific session
 * This allows each session to have its own isolated server context
 */
export const createSessionServer = (app: App, sessionManager?: SessionManager): ServerContext => {
	const server = new McpServer({
		name: "Obsidian Antinet Zettelkasten",
		version: "1.0.0",
	});

	// Attach session manager to server for tools to access
	(server as any).sessionManager = sessionManager;

	// Register tools for this session
	[
		readMainCardTool, 
		listTreeRootMainCard,
		getSessionStatsTool,
		cleanupSessionsTool
	].forEach((getTool) => {
		const tool = getTool({ app, server });
		registerTool(server, tool);
	});

	return { app, server };
};
