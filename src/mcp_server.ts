/* eslint-disable @typescript-eslint/no-unused-vars */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const createServer = () => {
	// Create server instance
	const server = new McpServer({
		name: "weather",
		version: "1.0.0",
	});

	// Register weather tools
	server.registerTool(
		"get-forecast",
		{
			title: "Get Weather Forecast",
			description: "Get weather forecast for a location",
			inputSchema: {
				latitude: z.number().min(-90).max(90),
				longitude: z.number().min(-180).max(180),
			},
		},
		async ({ latitude, longitude }) => {
			return {
				content: [
					{
						type: "text",
						text: "hi there",
					},
				],
			};
		},
	);

	return { server };
};
