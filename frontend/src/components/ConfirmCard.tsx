interface ConfirmCardProps {
  summary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmCard({ summary, onConfirm, onCancel }: ConfirmCardProps) {
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid #7c2d12",
        borderRadius: "10px",
        padding: "14px 16px",
        maxWidth: "320px",
        marginBottom: "4px",
      }}
    >
      <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#f97316", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Confirmation required
      </p>
      <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text)" }}>
        {summary}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onConfirm}
          style={{
            background: "#f97316",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          style={{
            background: "var(--border)",
            color: "var(--text)",
            border: "none",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
