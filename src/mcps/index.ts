import { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { App } from "obsidian";
import { ZodRawShape } from "zod";
import { SessionManager } from "../session_manager";

export interface MCPToolConfig<
	InputArgs extends ZodRawShape,
	OutputArgs extends ZodRawShape,
> {
	/** tool name */
	name: string;
	/** tool title */
	title?: string;
	description?: string;
	inputSchema?: InputArgs;
	outputSchema?: OutputArgs;
	annotations?: ToolAnnotations;
	_meta?: Record<string, unknown>;
	handler: ToolCallback<InputArgs>;
}

export interface ServerContext {
	app: App;
	server: McpServer;
	sessionManager: SessionManager;
}

export type RegisterToolCallback<
	InputArgs extends ZodRawShape,
	OutputArgs extends ZodRawShape,
> = (options: ServerContext) => MCPToolConfig<InputArgs, OutputArgs>;

export const registerTool = <
	InputArgs extends ZodRawShape,
	OutputArgs extends ZodRawShape,
>(
	server: McpServer,
	config: MCPToolConfig<InputArgs, OutputArgs>,
) => {
	server.registerTool(config.name, config, config.handler);
};
