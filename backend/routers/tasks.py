import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from mcp_client import call_tool

router = APIRouter(prefix="/tasks", tags=["tasks"])


class CreateTaskBody(BaseModel):
    title: str


@router.get("/")
async def list_tasks():
    return json.loads(await call_tool("list_tasks", {}))


@router.post("/", status_code=201)
async def create_task(body: CreateTaskBody):
    result = json.loads(await call_tool("add_task", {"title": body.title}))
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.patch("/{task_id}/complete")
async def complete_task(task_id: int):
    result = json.loads(await call_tool("complete_task", {"task_id": task_id}))
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.patch("/{task_id}/reopen")
async def reopen_task(task_id: int):
    result = json.loads(await call_tool("reopen_task", {"task_id": task_id}))
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.delete("/{task_id}")
async def delete_task(task_id: int):
    result = json.loads(await call_tool("delete_task", {"task_id": task_id}))
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
