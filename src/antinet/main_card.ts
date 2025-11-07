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

export const createMainCardInputSchema = {
	type: z
		.enum(["global", "project"])
		.describe("Card type: global or project"),
	content: z
		.string()
		.max(4000)
		.describe("Main card content (max 4000 characters)"),
	// TODO 应该传入要创建的笔记 id 而且需要判断新笔记id的父节点存在
	parentId: z
		.string()
		.optional()
		.describe("Parent card ID for hierarchical structure"),
};

export const createMainCardTool: RegisterToolCallback<
	typeof createMainCardInputSchema,
	any
> = (options) => {
	const { app } = options;
	const tool: MCPToolConfig<typeof createMainCardInputSchema, any> = {
		name: "create_main_card",
		title: "Create main card",
		description: "Create a new main card with content validation",
		inputSchema: createMainCardInputSchema,
		handler: async ({
			type,
			content,
			parentId,
		}: {
			type: string;
			content: string;
			parentId?: string;
		}) => {
			try {
				// 验证内容长度
				if (content.length > 4000) {
					return {
						content: [
							{
								type: "text",
								text: "Error: Content exceeds 4000 character limit",
							},
						],
						isError: true,
					};
				}

				// 生成卡片编号
				const cardId = await generateCardId(app, type, parentId);
				const fileName = `${cardId}.md`;
				const filePath = `ZK_MainBox/${fileName}`;

				// 创建文件内容
				const fileContent = `---
type: ${type}
created_at: ${new Date().toISOString()}
${parentId ? `parent_id: ${parentId}` : ""}
---

${content}`;

				// 检查文件是否已存在
				const existingFile = app.vault.getAbstractFileByPath(filePath);
				if (existingFile) {
					return {
						content: [
							{
								type: "text",
								text: `Error: Card ${cardId} already exists`,
							},
						],
						isError: true,
					};
				}

				// 创建 ZK_MainBox 目录（如果不存在）
				const mainBoxDir =
					app.vault.getAbstractFileByPath("ZK_MainBox");
				if (!mainBoxDir) {
					await app.vault.createFolder("ZK_MainBox");
				}

				// 创建主卡片文件
				await app.vault.create(filePath, fileContent);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									cardId,
									fileName,
									message: "Main card created successfully",
								},
								null,
								2,
							),
						},
					],
				};
			} catch (error) {
				console.error("createMainCardTool error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error creating main card: ${error.message}`,
						},
					],
					isError: true,
				};
			}
		},
	};

	return tool;
};

async function generateCardId(
	app: any,
	type: string,
	parentId?: string,
): Promise<string> {
	if (parentId) {
		// 基于父卡片生成子卡片编号
		return await generateChildCardId(app, parentId);
	}

	// 生成新的根卡片编号
	if (type === "project") {
		// 项目卡片使用特殊格式
		const timestamp = Date.now().toString(36);
		return `p.${timestamp.substring(0, 4)}`;
	}

	// 全局卡片使用数字编号
	const rootCards = await getRootCards(app);
	const nextNumber = rootCards.length + 1;
	return `${nextNumber}.1`;
}

async function generateChildCardId(
	app: any,
	parentId: string,
): Promise<string> {
	const parentFile = app.vault.getAbstractFileByPath(
		`ZK_MainBox/${parentId}.md`,
	);
	if (!parentFile) {
		throw new Error(`Parent card ${parentId} not found`);
	}

	// 获取父卡片的所有子卡片
	const children = await getChildCards(app, parentId);

	// 生成下一个子卡片编号（字母顺序）
	const nextChar = String.fromCharCode(97 + children.length); // a, b, c, ...
	return `${parentId}${nextChar}`;
}

async function getRootCards(app: any): Promise<any[]> {
	const files = app.vault.getFiles();
	return files.filter(
		(file) =>
			file.path.startsWith("ZK_MainBox/") &&
			/^\d+\.\d+(\.md)?$/.test(file.basename),
	);
}

async function getChildCards(app: any, parentId: string): Promise<any[]> {
	const files = app.vault.getFiles();
	const regex = new RegExp(`^${parentId}[a-z](\\.md)?$`);
	return files.filter(
		(file) =>
			file.path.startsWith("ZK_MainBox/") && regex.test(file.basename),
	);
}

export const appendMainCardInputSchema = {
	cardId: z.string().describe("Main card ID to append content to"),
	content: z
		.string()
		.max(200)
		.describe("Content to append (max 200 characters)"),
	position: z
		.enum(["start", "end"])
		.default("end")
		.describe("Position to append: start or end"),
};

export const appendMainCardTool: RegisterToolCallback<
	typeof appendMainCardInputSchema,
	any
> = (options) => {
	const { app } = options;
	const tool: MCPToolConfig<typeof appendMainCardInputSchema, any> = {
		name: "append_main_card",
		title: "Append content to main card",
		description:
			"Append content to existing main card with length validation",
		inputSchema: appendMainCardInputSchema,
		handler: async ({
			cardId,
			content,
			position,
		}: {
			cardId: string;
			content: string;
			position: string;
		}) => {
			try {
				// 验证内容长度
				if (content.length > 200) {
					return {
						content: [
							{
								type: "text",
								text: "Error: Append content exceeds 200 character limit",
							},
						],
						isError: true,
					};
				}

				const fileName = `${cardId}.md`;
				const filePath = `ZK_MainBox/${fileName}`;

				// 检查文件是否存在
				const file = app.vault.getAbstractFileByPath(filePath) as any; // TFile
				if (!file) {
					return {
						content: [
							{
								type: "text",
								text: `Error: Card ${cardId} not found`,
							},
						],
						isError: true,
					};
				}

				// 读取当前内容
				const currentContent = await app.vault.cachedRead(file);

				// 分割 frontmatter 和内容
				const frontmatterMatch = currentContent.match(
					/^---\n([\s\S]*?)\n---\n/,
				);
				let newContent = currentContent;

				if (frontmatterMatch) {
					const frontmatter = frontmatterMatch[0];
					const mainContent = currentContent.slice(
						frontmatter.length,
					);

					// 根据位置追加内容
					const timestamp = new Date().toISOString();
					const appendText = `\n\n> **追加内容** (${timestamp}):\n> ${content}\n`;

					if (position === "start") {
						newContent = frontmatter + appendText + mainContent;
					} else {
						newContent = frontmatter + mainContent + appendText;
					}
				} else {
					// 没有 frontmatter，直接在开头或结尾追加
					const timestamp = new Date().toISOString();
					const appendText = `\n\n> **追加内容** (${timestamp}):\n> ${content}\n`;

					if (position === "start") {
						newContent = appendText + currentContent;
					} else {
						newContent = currentContent + appendText;
					}
				}

				// 更新文件内容
				await app.vault.modify(file as any, newContent);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									cardId,
									message: "Content appended successfully",
									position,
									length: content.length,
								},
								null,
								2,
							),
						},
					],
				};
			} catch (error) {
				console.error("appendMainCardTool error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error appending content: ${error.message}`,
						},
					],
					isError: true,
				};
			}
		},
	};

	return tool;
};

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
