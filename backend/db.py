from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class Task:
    id: int
    title: str
    done: bool

    def to_dict(self) -> dict:
        return asdict(self)


class TaskStore:
    def __init__(self) -> None:
        self._tasks: list[Task] = [
            Task(1, "Set up project repo",   done=True),
            Task(2, "Write PRD",              done=True),
            Task(3, "Design database schema", done=False),
            Task(4, "Build REST API",         done=False),
            Task(5, "Implement MCP server",   done=False),
        ]
        self._next_id = 6

    def all(self) -> list[Task]:
        return list(self._tasks)

    def get(self, task_id: int) -> Optional[Task]:
        return next((t for t in self._tasks if t.id == task_id), None)

    def create(self, title: str) -> Task:
        task = Task(id=self._next_id, title=title, done=False)
        self._tasks.append(task)
        self._next_id += 1
        return task

    def update(self, task_id: int, **fields) -> Optional[Task]:
        task = self.get(task_id)
        if task is None:
            return None
        for key, value in fields.items():
            setattr(task, key, value)
        return task

    def delete(self, task_id: int) -> Optional[Task]:
        for i, task in enumerate(self._tasks):
            if task.id == task_id:
                return self._tasks.pop(i)
        return None


# Module-level singleton — shared by services, tools, and routers
store = TaskStore()
