interface Task {
  id: number;
  title: string;
  done: boolean;
}

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
}

export function TaskList({ tasks, loading }: TaskListProps) {
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  if (loading) {
    return (
      <div style={{ padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
        Loading tasks…
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      {pending.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 10px 4px" }}>
            Pending · {pending.length}
          </p>
          {pending.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 10px 4px" }}>
            Completed · {done.length}
          </p>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{ padding: "32px 4px", color: "var(--text-muted)", fontSize: "14px" }}>
          No tasks yet. Ask the agent to add one!
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: { id: number; title: string; done: boolean } }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        marginBottom: "4px",
        borderRadius: "8px",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        transition: "border-color 0.15s",
      }}
    >
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "4px",
          border: task.done ? "none" : "2px solid var(--border)",
          background: task.done ? "var(--accent)" : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {task.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#0e0e0f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <span
        style={{
          fontSize: "14px",
          color: task.done ? "var(--text-muted)" : "var(--text)",
          textDecoration: task.done ? "line-through" : "none",
          flex: 1,
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </span>

      <span
        className="mono"
        style={{ fontSize: "11px", color: "var(--text-muted)" }}
      >
        #{task.id}
      </span>
    </div>
  );
}
