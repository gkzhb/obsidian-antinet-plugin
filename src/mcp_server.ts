/* eslint-disable @typescript-eslint/no-unused-vars */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { App } from "obsidian";

import {
	listTreeRootMainCard,
	readMainCardTool,
	createMainCardTool,
	appendMainCardTool,
} from "./antinet/main_card";
import { initAntinetTool } from "./antinet/init_tools";
import {
	getSessionStatsTool,
	cleanupSessionsTool,
} from "./antinet/session_tools";
import { registerTool, ServerContext } from "./mcps";
import { SessionManager } from "./session_manager";

/**
 * Create a new MCP server instance with all tools registered
 * This function focuses on MCP protocol implementation and tool registration
 */
export const createMcpServer = (
	app: App,
	sessionManager: SessionManager,
): McpServer => {
	const server = new McpServer({
		name: "Obsidian Antinet Zettelkasten",
		version: "1.0.0",
	});

	// Create server context for tool registration
	const context: ServerContext = { app, server, sessionManager };

	// Register tools for this server instance
	[
		readMainCardTool,
		listTreeRootMainCard,
		initAntinetTool,
		createMainCardTool,
		appendMainCardTool,
		getSessionStatsTool,
		cleanupSessionsTool,
	].forEach((getTool) => {
		const tool = getTool(context);
		registerTool(server, tool);
	});

	return server;
};
