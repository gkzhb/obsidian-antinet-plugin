# Session Management Implementation

This document describes the session state management implementation for the Obsidian Antinet Zettelkasten MCP Plugin.

## Overview

The plugin implements a **分层会话管理架构**，清晰划分 SessionManager 和 McpServer 的职责边界，实现状态化 MCP 连接管理。

## 架构设计原则

### 1. 职责分离 (Separation of Concerns)
- **SessionManager**: 专注于会话生命周期管理和状态维护
- **McpServer**: 专注于 MCP 协议实现和工具业务逻辑
- **单向依赖**: McpServer → SessionManager，避免循环依赖

### 2. 资源管理
- **统一创建**: 在路由层统一创建会话相关资源
- **明确归属**: 每个资源有明确的创建者和销毁者
- **优雅关闭**: 统一的资源清理机制

## 核心组件职责

### 1. Session Manager (`src/session_manager.ts`)

**核心职责**: 会话状态管理
- **会话生命周期**: 创建、获取、删除会话 (createSession/getSession/removeSession)
- **会话状态维护**: 跟踪活动时间、过期清理 (cleanupExpiredSessions)
- **会话隔离**: 每个会话独立的上下文环境
- **资源清理**: 优雅关闭会话相关资源 (shutdown)
- **会话统计**: 提供会话状态监控 (getSessionStats)

### 2. Mcp Server (`src/mcp_server.ts`)

**核心职责**: MCP 协议和工具实现
- **MCP 协议处理**: 处理 MCP 请求响应流程
- **工具注册管理**: 注册和管理 MCP 工具 (readMainCardTool 等)
- **业务逻辑封装**: 提供具体的工具功能实现
- **应用上下文传递**: 传递 Obsidian app 实例给工具使用

### 3. Session Context

每个会话维护独立的上下文:
- 唯一会话 ID
- MCP transport 实例 (协议通信层)
- 创建时间戳和最后活动时间
- **不包含**: MCP server 实例 (由 McpServer 层管理)

### 4. Session Tools

MCP 工具通过 McpServer 注册和管理:
- `get_session_stats`: 返回当前会话统计信息
- `cleanup_sessions`: 手动触发清理过期会话
- `read_main_card`: 读取主卡片内容
- `list_tree_root_main_card`: 列出树根主卡片

## Usage

### Client Connection Flow

1. **Initialize Session**: Client sends an `initialize` request without a session ID
2. **Session Created**: Server creates new session and returns session ID in response headers
3. **Subsequent Requests**: Client includes `mcp-session-id` header with session ID
4. **Session Continuity**: Server uses existing session context for processing

### HTTP Headers

- **Request**: 包含 `mcp-session-id: <session-id>` 用于现有会话
- **Response**: 新会话在响应头中包含会话 ID

### 请求处理流程 (`src/mcp.ts`)

1. **路由层接收请求**: 在 `/mcp` 端点处理所有 MCP 请求
2. **会话识别**: 从请求头获取会话 ID
3. **会话验证**: 检查会话有效性和过期状态
4. **资源创建**: 统一创建 McpServer 和会话资源
5. **请求分发**: 通过会话的 transport 处理具体请求

### Error Handling

- **Invalid Session**: Returns error code `-32002` for invalid/expired sessions
- **Missing Session**: Non-initialize requests without valid session return error
- **Internal Errors**: Returns standard JSON-RPC error responses

## Configuration

### Session Timeout

Sessions expire after 30 minutes of inactivity. This can be modified in `session_manager.ts`:

```typescript
private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
```

### Cleanup Interval

Expired sessions are cleaned up every 5 minutes. This can be modified in the `startCleanupTimer` method.

## 实现细节

### 会话存储

会话存储在 `Map<string, SessionContext>` 中，提供高效的查找和管理。

### 资源管理优化

- **避免重复创建**: 会话只包含 transport，McpServer 在路由层统一创建
- **明确依赖关系**: SessionManager 不依赖 McpServer，减少循环依赖
- **统一清理机制**: 在 SessionManager 中统一关闭所有会话资源

### 内存管理

- 自动清理防止内存泄漏
- 优雅关闭确保资源正确释放
- 会话统计帮助监控资源使用情况

### 线程安全

实现针对单线程 Node.js 环境设计。会话操作是同步和原子性的。

## Example Client Usage

```javascript
// First request - initialize session
const initResponse = await fetch('/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { /* initialization params */ },
    id: 1
  })
});

// Extract session ID from response headers
const sessionId = initResponse.headers.get('mcp-session-id');

// Subsequent requests - include session ID
const response = await fetch('/mcp', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'mcp-session-id': sessionId
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'read_main_card',
    params: { id: '3.1' },
    id: 2
  })
});
```

## Migration from Stateless

The implementation is backward compatible:
- New clients get stateful behavior automatically
- Each session is isolated and independent
- No changes required to existing MCP tools

## Monitoring and Debugging

### Server Logs

The implementation provides detailed logging:
- Session creation and removal
- Session lookup results
- Cleanup operations
- Error conditions

### Session Statistics

Use the `get_session_stats` tool to monitor:
- Total active sessions
- Expired sessions awaiting cleanup
- Overall session health

## Security Considerations

- Session IDs are randomly generated and unique
- Sessions automatically expire to prevent indefinite access
- No sensitive data is stored in session context
- Proper error handling prevents information leakage