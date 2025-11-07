import { z } from "zod";
import { MCPToolConfig, RegisterToolCallback } from "../mcps";
import * as fs from "fs/promises";
import * as path from "path";

interface AntinetConfig {
	projectId: string;
	mainCardId: string;
	createdAt: string;
	updatedAt: string;
}

export const initAntinetInputSchema = {
	workspacePath: z.string().describe("Workspace directory path"),
};

export const initAntinetTool: RegisterToolCallback<
	typeof initAntinetInputSchema,
	any
> = (options) => {
	const { app } = options;
	const tool: MCPToolConfig<typeof initAntinetInputSchema, any> = {
		name: "init_antinet",
		title: "Initialize Antinet project",
		description:
			"Initialize Antinet project by reading or creating .antinet.json config",
		inputSchema: initAntinetInputSchema,
		handler: async ({ workspacePath }: { workspacePath: string }) => {
			try {
				const configPath = path.join(workspacePath, ".antinet.json");

				// 检查配置文件是否存在
				let config: AntinetConfig;
				try {
					const configContent = await fs.readFile(
						configPath,
						"utf-8",
					);
					config = JSON.parse(configContent);

					// 验证配置格式
					if (!config.projectId || !config.mainCardId) {
						throw new Error("Invalid config format");
					}

					// TODO 返回主卡片内容
					// TODO 绝对路径和 frontmatter 记录的绝对路径不一致时，更新 frontmatter 属性
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										projectId: config.projectId,
										mainCardId: config.mainCardId,
										message: "Project already initialized",
									},
									null,
									2,
								),
							},
						],
					};
				} catch (error) {
					// 配置文件不存在或无效，创建新的
					const projectId = generateUUID();
					const mainCardId = await createProjectMainCard(
						app,
						projectId,
					);

					config = {
						projectId,
						mainCardId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};

					// 写入配置文件
					await fs.writeFile(
						configPath,
						JSON.stringify(config, null, 2),
					);

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										projectId: config.projectId,
										mainCardId: config.mainCardId,
										message:
											"Project initialized successfully",
									},
									null,
									2,
								),
							},
						],
					};
				}
			} catch (error) {
				console.error("initAntinetTool error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error initializing project: ${error.message}`,
						},
					],
					isError: true,
				};
			}
		},
	};

	return tool;
};

async function createProjectMainCard(
	app: any,
	projectId: string,
): Promise<string> {
	// 生成项目主卡片编号 (格式: 项目ID的前8位作为根节点)
	const rootNode = projectId.substring(0, 8).replace(/[^a-zA-Z0-9]/g, "");
	const mainCardId = `${rootNode}.1`;

	const fileName = `${mainCardId}.md`;
	const filePath = `ZK_MainBox/${fileName}`;

	// TODO frontmatter 记录项目绝对路径
	const content = `---
project_id: ${projectId}
type: project_root
created_at: ${new Date().toISOString()}
---

# 项目主卡片 ${mainCardId}

这是项目的根节点主卡片，用于管理项目相关的知识内容。

**项目ID**: ${projectId}
**创建时间**: ${new Date().toLocaleString()}

## 项目说明

在此处添加项目的详细说明和使用指南。
`;

	// 检查文件是否已存在
	const existingFile = app.vault.getAbstractFileByPath(filePath);
	if (existingFile) {
		return mainCardId;
	}

	// 创建 ZK_MainBox 目录（如果不存在）
	const mainBoxDir = app.vault.getAbstractFileByPath("ZK_MainBox");
	if (!mainBoxDir) {
		await app.vault.createFolder("ZK_MainBox");
	}

	// 创建主卡片文件
	await app.vault.create(filePath, content);

	return mainCardId;
}

function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			const r = (Math.random() * 16) | 0;
			const v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		},
	);
}
