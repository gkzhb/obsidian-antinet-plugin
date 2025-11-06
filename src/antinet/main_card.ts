import { z } from "zod";
import { MCPToolConfig, RegisterToolCallback } from "../mcps";
import { DvPage, getDv } from "../utils/dataview";

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
				const dv = getDv();
				// 使用 dataview API 根据文件名查找文件
				const files: DvPage[] = dv
					.pages()
					.where((p) => p.file.name === id);
				if (files.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `File not found: ${id}`,
							},
						],
						isError: true,
					};
				}

				const file = files[0];
				const tfile = await app.vault.getFileByPath(file.file.path);
				if (!tfile) {
					throw new Error(
						`Obsidian read file "${file.file.path}" not found`,
					);
				}
				const content = await app.vault.cachedRead(tfile);
				return {
					content: [
						{
							type: "text",
							text: content,
						},
					],
				};
			} catch (error) {
				console.error("readMainCardTool error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error reading file: ${error.message}`,
						},
					],
					isError: true,
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
					}),
				);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(fileList, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error listing files: ${error.message}`,
						},
					],
					isError: true,
				};
			}
		},
	};

	return tool;
};
