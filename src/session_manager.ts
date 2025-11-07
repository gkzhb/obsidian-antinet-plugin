import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

export interface SessionContext {
	transport: StreamableHTTPServerTransport;
	createdAt: Date;
	lastActivity: Date;
	sessionId: string;
}

export class SessionManager {
	private sessions: Map<string, SessionContext> = new Map();
	private cleanupInterval?: NodeJS.Timeout;
	private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

	constructor() {
		this.startCleanupTimer();
	}

	/**
	 * Generate a unique session ID
	 */
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}

	/**
	 * Create a new session
	 */
	createSession(): SessionContext {
		const sessionId = this.generateSessionId();
		const now = new Date();

		// Create transport with session ID generator
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: () => sessionId,
		});

		const context: SessionContext = {
			transport,
			createdAt: now,
			lastActivity: now,
			sessionId,
		};

		this.sessions.set(sessionId, context);
		console.log(`Created new session: ${sessionId}`);

		return context;
	}

	/**
	 * Get existing session by ID
	 */
	getSession(sessionId: string): SessionContext | undefined {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.lastActivity = new Date();
		}
		return session;
	}

	/**
	 * Remove a session
	 */
	removeSession(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			console.log(`Removing session: ${sessionId}`);
			this.sessions.delete(sessionId);

			// Clean up resources
			try {
				session.transport.close();
			} catch (error) {
				console.error(
					`Error closing transport for session ${sessionId}:`,
					error,
				);
			}


		}
	}

	/**
	 * Check if request is an initialize request
	 */
	isInitializeRequest(body: any): boolean {
		return isInitializeRequest(body);
	}

	/**
	 * Get session from request headers
	 */
	getSessionFromRequest(req: any): SessionContext | undefined {
		const sessionId = req.headers["mcp-session-id"];
		if (typeof sessionId === "string") {
			return this.getSession(sessionId);
		}
		return undefined;
	}

	/**
	 * Clean up expired sessions
	 */
	cleanupExpiredSessions(): void {
		const now = new Date();
		const expiredSessions: string[] = [];

		for (const [sessionId, context] of this.sessions.entries()) {
			const timeSinceLastActivity =
				now.getTime() - context.lastActivity.getTime();
			if (timeSinceLastActivity > this.SESSION_TIMEOUT_MS) {
				expiredSessions.push(sessionId);
			}
		}

		for (const sessionId of expiredSessions) {
			console.log(`Cleaning up expired session: ${sessionId}`);
			this.removeSession(sessionId);
		}

		if (expiredSessions.length > 0) {
			console.log(
				`Cleaned up ${expiredSessions.length} expired sessions`,
			);
		}
	}

	/**
	 * Start cleanup timer
	 */
	private startCleanupTimer(): void {
		// Clean up every 5 minutes
		this.cleanupInterval = setInterval(
			() => {
				this.cleanupExpiredSessions();
			},
			5 * 60 * 1000,
		);
	}

	/**
	 * Stop cleanup timer
	 */
	stopCleanupTimer(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = undefined;
		}
	}

	/**
	 * Get session statistics
	 */
	getSessionStats(): {
		totalSessions: number;
		activeSessions: number;
		expiredSessions: number;
	} {
		const now = new Date();
		let activeCount = 0;
		let expiredCount = 0;

		for (const context of this.sessions.values()) {
			const timeSinceLastActivity =
				now.getTime() - context.lastActivity.getTime();
			if (timeSinceLastActivity <= this.SESSION_TIMEOUT_MS) {
				activeCount++;
			} else {
				expiredCount++;
			}
		}

		return {
			totalSessions: this.sessions.size,
			activeSessions: activeCount,
			expiredSessions: expiredCount,
		};
	}

	/**
	 * Shutdown all sessions
	 */
	async shutdown(): Promise<void> {
		console.log("Shutting down session manager...");
		this.stopCleanupTimer();

		const shutdownPromises = Array.from(this.sessions.entries()).map(
			async ([sessionId, context]) => {
				console.log(`Shutting down session: ${sessionId}`);
				try {
					await context.transport.close();
				} catch (error) {
					console.error(
						`Error closing transport for session ${sessionId}:`,
						error,
					);
				}

			},
		);

		await Promise.all(shutdownPromises);
		this.sessions.clear();
		console.log("Session manager shutdown complete");
	}
}

