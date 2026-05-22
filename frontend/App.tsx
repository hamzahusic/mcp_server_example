import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "./src/hooks/useWebSocket";
import { TaskList } from "./src/components/TaskList";
import { ConfirmCard } from "./src/components/ConfirmCard";

interface Task {
  id: number;
  title: string;
  done: boolean;
}

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  isStreaming?: boolean;
}

interface ConfirmState {
  summary: string;
  tool_use_id: string;
  task_id: number;
}

const WS_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/agent`
    : "ws://localhost:8000/ws/agent";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendWsRef = useRef<((data: unknown) => void) | null>(null);

  const handleWsMessage = useCallback(
    (data: unknown) => {
      const msg = data as Record<string, unknown>;

      if (msg.type === "text_delta") {
        const chunk = msg.content as string;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + chunk },
            ];
          }
          return [
            ...prev,
            { role: "agent", content: chunk, isStreaming: true },
          ];
        });
      }

      if (msg.type === "tasks_updated") {
        setTasks(msg.tasks as Task[]);
        setTasksLoading(false);
      }

      if (msg.type === "message_complete") {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) {
            return [...prev.slice(0, -1), { ...last, isStreaming: false }];
          }
          return prev;
        });
        setAgentTyping(false);
      }

      if (msg.type === "confirmation_required") {
        setAgentTyping(false);
        setConfirmState({
          summary: msg.summary as string,
          tool_use_id: msg.tool_use_id as string,
          task_id: msg.task_id as number,
        });
      }
    },
    [setTasks, setTasksLoading]
  );

  const { send } = useWebSocket(WS_URL, handleWsMessage);

  useEffect(() => {
    sendWsRef.current = send;
  }, [send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || agentTyping) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setAgentTyping(true);
    send({ type: "user_message", content: text });
  };

  const handleConfirm = (confirmed: boolean) => {
    send({ type: "user_confirmation", confirmed });
    setConfirmState(null);
    if (confirmed) {
      setAgentTyping(true);
    } else {
      setAgentTyping(true);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT PANEL — Task List ── */}
      <div
        style={{
          width: "380px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 20px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "var(--accent)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#0e0e0f" />
                <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#0e0e0f" />
                <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#0e0e0f" />
                <path d="M8 10.5H13M10.5 8V13" stroke="#0e0e0f" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, letterSpacing: "-0.01em" }}>
              Tasks
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
            {tasks.filter((t) => !t.done).length} pending · managed by AI agent
          </p>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }}>
          <TaskList tasks={tasks} loading={tasksLoading} />
        </div>
      </div>

      {/* ── RIGHT PANEL — Chat ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
            }}
          />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
            Agent
          </span>
          <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "2px" }}>
            claude-sonnet · MCP
          </span>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                marginTop: "60px",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✦</div>
              Ask me to manage your tasks.
              <br />
              <span className="mono" style={{ fontSize: "12px" }}>
                "What tasks do I have?" · "Add: Write unit tests" · "Mark #3 done"
              </span>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user" ? "var(--user-bubble)" : "var(--agent-bubble)",
                  border: `1px solid ${msg.role === "user" ? "#3a5212" : "var(--border)"}`,
                  fontSize: "14px",
                  lineHeight: 1.55,
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
                {msg.isStreaming && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "14px",
                      background: "var(--accent)",
                      marginLeft: "3px",
                      verticalAlign: "middle",
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Confirmation card */}
          {confirmState && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <ConfirmCard
                summary={confirmState.summary}
                onConfirm={() => handleConfirm(true)}
                onCancel={() => handleConfirm(false)}
              />
            </div>
          )}

          {/* Typing indicator */}
          {agentTyping && !messages.some((m) => m.isStreaming) && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px 14px 14px 4px",
                  background: "var(--agent-bubble)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--text-muted)",
                      animation: `bounce 1.2s ${d * 0.2}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message the agent…"
            rows={1}
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "14px",
              color: "var(--text)",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              lineHeight: 1.5,
              maxHeight: "120px",
              overflowY: "auto",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || agentTyping}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: input.trim() && !agentTyping ? "var(--accent)" : "var(--surface-2)",
              border: "none",
              cursor: input.trim() && !agentTyping ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 13V3M8 3L3 8M8 3L13 8"
                stroke={input.trim() && !agentTyping ? "#0e0e0f" : "var(--text-muted)"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
