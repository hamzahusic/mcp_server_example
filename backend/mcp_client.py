import os
import json
from fastmcp import Client as MCPClient
from tools.tasks import mcp

# Used by the Anthropic path: their servers connect to this SSE URL
MCP_SERVER_URL = os.environ.get("MCP_SERVER_URL", "http://localhost:8000/sse")


async def call_tool(tool_name: str, tool_input: dict) -> str:
    """Execute an MCP tool in-process (no network hop)."""
    try:
        async with MCPClient(mcp) as client:
            result = await client.call_tool(tool_name, tool_input)
            return json.dumps(result.data)
    except Exception as e:
        return json.dumps({"error": str(e)})


async def get_tools() -> list[dict]:
    """Discover registered MCP tools in-process, returned in OpenAI function format."""
    async with MCPClient(mcp) as client:
        tools = await client.list_tools()
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
