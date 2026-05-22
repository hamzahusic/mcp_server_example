import { useEffect, useRef, useCallback } from "react";

type MessageHandler = (data: unknown) => void;

export function useWebSocket(url: string, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let active = true;

    // Defer creation by one microtask so React StrictMode's synchronous
    // mount→unmount→remount cycle cancels the first attempt cleanly,
    // leaving only the real mount to open the connection.
    const id = setTimeout(() => {
      if (!active) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = (e) => console.error("WebSocket error", e);
    }, 0);

    return () => {
      active = false;
      clearTimeout(id);
      if (wsRef.current) {
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
