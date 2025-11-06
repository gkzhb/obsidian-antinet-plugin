/* eslint-disable @typescript-eslint/no-unused-vars */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TFile, App } from "obsidian";

export const createServer = (app: App) => {
	// Create server instance
	const server = new McpServer({
		name: "Obsidian Antinet Zettelkasten",
		version: "1.0.0",
	});

	// Register tools
	server.registerTool(
		"read_main_card",
		{
			title: "Read main card content",
			inputSchema: {
				id: z.string().describe("Main card ID"),
			},
		},
		async ({ id }) => {
			try {
				// 使用 Obsidian API 读取笔记内容
				const file = app.vault.getAbstractFileByPath(id);
				if (!file || !(file instanceof TFile)) {
					return {
						content: [
							{
								type: "text",
								text: `File not found: ${id}`,
							},
						],
					};
				}
				
				const content = await app.vault.read(file);
				return {
					content: [
						{
							type: "text",
							text: content,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error reading file: ${error.message}`,
						},
					],
				};
			}
		},
	);

	return { server };
};
