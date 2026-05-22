from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
