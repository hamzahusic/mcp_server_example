from fastmcp import FastMCP
import services.tasks as svc

mcp = FastMCP("Task Manager")


@mcp.tool()
def list_tasks() -> list:
    """Return all tasks with their id, title, and done status."""
    return svc.list_all()


@mcp.tool()
def add_task(title: str) -> dict:
    """Add a new task. Returns the created task."""
    return svc.create(title)


@mcp.tool()
def complete_task(task_id: int) -> dict:
    """Mark a task as done. Returns the updated task."""
    return svc.complete(task_id)


@mcp.tool()
def reopen_task(task_id: int) -> dict:
    """Mark a task as not done (reopen it). Returns the updated task."""
    return svc.reopen(task_id)


@mcp.tool()
def delete_task(task_id: int) -> dict:
    """Delete a task by id. Returns confirmation."""
    return svc.remove(task_id)
