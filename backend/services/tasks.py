from db import store


def list_all() -> list[dict]:
    return [t.to_dict() for t in store.all()]


def create(title: str) -> dict:
    return store.create(title).to_dict()


def complete(task_id: int) -> dict:
    task = store.update(task_id, done=True)
    if task is None:
        return {"error": f"Task {task_id} not found"}
    return task.to_dict()


def reopen(task_id: int) -> dict:
    task = store.update(task_id, done=False)
    if task is None:
        return {"error": f"Task {task_id} not found"}
    return task.to_dict()


def remove(task_id: int) -> dict:
    task = store.delete(task_id)
    if task is None:
        return {"error": f"Task {task_id} not found"}
    return {"deleted": True, "task": task.to_dict()}
