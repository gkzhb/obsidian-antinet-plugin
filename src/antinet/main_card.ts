import { z } from "zod";
import { TFile } from "obsidian";
import { MCPToolConfig, RegisterToolCallback } from "../mcps";

export const readMainCardInputSchema = {
	id: z.string().describe("Main card ID"),
};

export const readMainCardTool: RegisterToolCallback<
	typeof readMainCardInputSchema,
	any
> = (options) => {
	const { app } = options;
	const tool: MCPToolConfig<typeof readMainCardInputSchema, any> = {
		name: "read_main_card",
		title: "Read main card content",
		inputSchema: readMainCardInputSchema,
		handler: async ({ id }: { id: string }) => {
			try {
				// 使用 Obsidian API 读取笔记内容
				const file = app.vault.getAbstractFileByPath(id);
				if (!file || !(file instanceof TFile)) {
					return {
						content: [
							{
								type: "text" as const,
								text: `File not found: ${id}`,
							},
						],
					};
				}

				const content = await app.vault.read(file);
				return {
					content: [
						{
							type: "text" as const,
							text: content,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error reading file: ${error.message}`,
						},
					],
				};
			}
		},
	};

	return tool;
};

export const listNumberedFilesInputSchema = {};

export const listTreeRootMainCard: RegisterToolCallback<
	typeof listNumberedFilesInputSchema,
	any
> = (options) => {
	const { app } = options;
	const tool: MCPToolConfig<typeof listNumberedFilesInputSchema, any> = {
		name: "list_tree_root_main_cards",
		title: "List tree root main cards",
		description:
			"List all files matching pattern like 3.x (e.g., 3.1, 3.2, etc.)",
		inputSchema: listNumberedFilesInputSchema,
		handler: async () => {
			try {
				const regex = /^\d+\.\d+$/;
				const files = app.vault
					.getFiles()
					.filter((file) => regex.test(file.basename));

				const fileList = await Promise.all(
					files.map(async (file) => {
						const metadata = app.metadataCache.getFileCache(file);
						let title = file.basename;
						
						// 使用 getFileCache 获取 frontmatter 中的 title
						if (metadata?.frontmatter?.title) {
							title = metadata.frontmatter.title;
						}
						
						return {
							path: file.path,
							name: file.name,
							basename: file.basename,
							title: title,
						};
					})
				);

				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(fileList, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error listing files: ${error.message}`,
						},
					],
				};
			}
		},
	};

	return tool;
};
