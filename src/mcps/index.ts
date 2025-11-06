import { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { App } from "obsidian";
import { ZodRawShape } from "zod";

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

export type RegisterToolCallback<
	InputArgs extends ZodRawShape,
	OutputArgs extends ZodRawShape,
> = (options: {
	app: App;
	server: McpServer;
}) => MCPToolConfig<InputArgs, OutputArgs>;

export const registerTool = <
	InputArgs extends ZodRawShape,
	OutputArgs extends ZodRawShape,
>(
	server: McpServer,
	config: MCPToolConfig<InputArgs, OutputArgs>,
) => {
	server.registerTool(config.name, config, config.handler);
};
