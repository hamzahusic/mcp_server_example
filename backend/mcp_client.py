import os
import json
from fastmcp import Client as MCPClient

MCP_SERVER_URL = os.environ.get("MCP_SERVER_URL", "http://localhost:8002/sse")


async def call_tool(tool_name: str, tool_input: dict) -> str:
    """Call an MCP tool and return its result as a JSON string."""
    try:
        async with MCPClient(MCP_SERVER_URL) as mcp:
            result = await mcp.call_tool(tool_name, tool_input)
            return json.dumps(result.data)
    except Exception as e:
        return json.dumps({"error": str(e)})


async def get_tools() -> list[dict]:
    """Discover tools from the MCP server in OpenAI function-calling format."""
    async with MCPClient(MCP_SERVER_URL) as mcp:
        tools = await mcp.list_tools()
        return [
            {
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description or "",
                    "parameters": t.inputSchema,
                },
            }
            for t in tools
        ]


async def get_tasks() -> list:
    """Return the current task list from the MCP server."""
    try:
        async with MCPClient(MCP_SERVER_URL) as mcp:
            result = await mcp.call_tool("list_tasks", {})
            if isinstance(result.data, list):
                return result.data
    except Exception:
        pass
    return []
