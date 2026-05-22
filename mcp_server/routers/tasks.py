from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import services.tasks as svc

router = APIRouter(prefix="/tasks", tags=["tasks"])


class CreateTaskBody(BaseModel):
    title: str


@router.get("/")
def list_tasks():
    return svc.list_all()


@router.post("/", status_code=201)
def create_task(body: CreateTaskBody):
    return svc.create(body.title)


@router.patch("/{task_id}/complete")
def complete_task(task_id: int):
    result = svc.complete(task_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.patch("/{task_id}/reopen")
def reopen_task(task_id: int):
    result = svc.reopen(task_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.delete("/{task_id}")
def delete_task(task_id: int):
    result = svc.remove(task_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
