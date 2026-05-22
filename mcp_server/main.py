import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from tools.tasks import mcp
from routers.tasks import router as tasks_router
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="MCP Task Server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# REST endpoints — must be registered before mounting the MCP sub-app
app.include_router(tasks_router, prefix="/api")

# MCP protocol endpoints (/sse, /messages/)
app.mount("/", mcp.http_app(transport="sse"))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=False)
