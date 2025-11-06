import { App } from "obsidian";
import { IRoute, Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./mcp_server";

export const registerMcpRoute = (route: IRoute, app: App) => {
	// Initialize transport
	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined, // set to undefined for stateless servers
	});

	// MCP endpoint
	route.post(async (req: Request, res: Response) => {
		console.log("Received MCP request:", req.body);
		try {
			await transport.handleRequest(req, res, req.body);
		} catch (error) {
			console.error("Error handling MCP request:", error);
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: "Internal server error",
					},
					id: null,
				});
			}
		}
	});

	// Method not allowed handlers
	const methodNotAllowed = (req: Request, res: Response) => {
		console.log(`Received ${req.method} MCP request`);
		res.status(405).json({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Method not allowed.",
			},
			id: null,
		});
	};

	route.get(methodNotAllowed);
	route.delete(methodNotAllowed);

	const { server } = createServer(app);
	server.connect(transport);
	// Handle server shutdown
	process.on("SIGINT", async () => {
		console.log("Shutting down server...");
		try {
			console.log(`Closing transport`);
			await transport.close();
		} catch (error) {
			console.error(`Error closing transport:`, error);
		}

		try {
			await server.close();
			console.log("Server shutdown complete");
		} catch (error) {
			console.error("Error closing server:", error);
		}
		process.exit(0);
	});
};
