import { App } from "obsidian";
import { IRoute, Request, Response } from "express";
import { SessionManager } from "./session_manager";
import { createSessionServer } from "./mcp_server";

export const registerMcpRoute = (route: IRoute, app: App) => {
	// Initialize session manager
	const sessionManager = new SessionManager();

	// MCP endpoint
	route.post(async (req: Request, res: Response) => {
		console.log("Received MCP request:", req.body);
		
		try {
			// Get session from request headers
			const existingSession = sessionManager.getSessionFromRequest(req);
			
			// Check if this is an initialize request
			const isInitialize = sessionManager.isInitializeRequest(req.body);
			
			let sessionContext: any;
			
			// Handle session creation or retrieval
			if (existingSession) {
				// Use existing session
				sessionContext = existingSession;
				console.log(`Using existing session: ${sessionContext.sessionId}`);
			} else if (isInitialize) {
				// Create new session for initialize request
				sessionContext = sessionManager.createSession();
				console.log(`Created new session: ${sessionContext.sessionId}`);
				
				// Connect server to transport for new session
				const { server } = createSessionServer(app, sessionManager);
				await server.connect(sessionContext.transport);
			} else {
				// Invalid session and not initialize request
				console.log("Invalid session ID and not initialize request");
				if (!res.headersSent) {
					res.status(400).json({
						jsonrpc: "2.0",
						error: {
							code: -32002,
							message: "Invalid session ID. Please initialize a new session.",
						},
						id: null,
					});
				}
				return;
			}
			
			// Handle the request with the session transport
			await sessionContext.transport.handleRequest(req, res, req.body);
			
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

	// Handle server shutdown
	process.on("SIGINT", async () => {
		console.log("Shutting down MCP server...");
		try {
			await sessionManager.shutdown();
			console.log("MCP server shutdown complete");
		} catch (error) {
			console.error("Error during MCP server shutdown:", error);
		}
		process.exit(0);
	});

	// Return session manager for potential external use
	return { sessionManager };
};
