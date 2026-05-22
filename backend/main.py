import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tools.tasks import mcp
from agent import router as agent_router
from routers.tasks import router as tasks_router

app = FastAPI(title="Task Manager Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)
app.include_router(tasks_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


# Mount LAST — it's a catch-all (handles /sse, /messages/) and must not shadow
# the routes registered above.
app.mount("/", mcp.http_app(transport="sse"))
