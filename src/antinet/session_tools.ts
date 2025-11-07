import { MCPToolConfig, RegisterToolCallback } from "../mcps";

export const getSessionStatsInputSchema = {};

export const getSessionStatsTool: RegisterToolCallback<
	typeof getSessionStatsInputSchema,
	any
> = (options) => {
	const { server } = options;
	
	// Get session manager from the server context
	const sessionManager = (server as any).sessionManager;
	
	const tool: MCPToolConfig<typeof getSessionStatsInputSchema, any> = {
		name: "get_session_stats",
		title: "Get session statistics",
		description: "Get current session statistics including active and total sessions",
		inputSchema: getSessionStatsInputSchema,
		handler: async () => {
			try {
				if (!sessionManager) {
					return {
						content: [
							{
								type: "text",
								text: "Session manager not available",
							},
						],
						isError: true,
					};
				}

				const stats = sessionManager.getSessionStats();
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(stats, null, 2),
						},
					],
				};
			} catch (error) {
				console.error("getSessionStatsTool error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error getting session stats: ${error.message}`,
						},
					],
					isError: true,
				};
			}
		},
	};

	return tool;
};

export const cleanupSessionsInputSchema = {};

export const cleanupSessionsTool: RegisterToolCallback<
	typeof cleanupSessionsInputSchema,
	any
> = (options) => {
	const { server } = options;
	
	// Get session manager from the server context
	const sessionManager = (server as any).sessionManager;
	
	const tool: MCPToolConfig<typeof cleanupSessionsInputSchema, any> = {
		name: "cleanup_sessions",
		title: "Cleanup expired sessions",
		description: "Manually trigger cleanup of expired sessions",
		inputSchema: cleanupSessionsInputSchema,
		handler: async () => {
			try {
				if (!sessionManager) {
					return {
						content: [
							{
								type: "text",
								text: "Session manager not available",
							},
						],
						isError: true,
					};
				}

				const beforeStats = sessionManager.getSessionStats();
				sessionManager["cleanupExpiredSessions"](); // Access private method
				const afterStats = sessionManager.getSessionStats();
				
				const cleanedUp = beforeStats.totalSessions - afterStats.totalSessions;
				
				return {
					content: [
						{
							type: "text",
							text: `Cleanup completed. Removed ${cleanedUp} expired sessions.\nBefore: ${JSON.stringify(beforeStats, null, 2)}\nAfter: ${JSON.stringify(afterStats, null, 2)}`,
						},
					],
				};
			} catch (error) {
				console.error("cleanupSessionsTool error", error);
				return {
					content: [
						{
							type: "text",
							text: `Error cleaning up sessions: ${error.message}`,
						},
					],
					isError: true,
				};
			}
		},
	};

	return tool;
};