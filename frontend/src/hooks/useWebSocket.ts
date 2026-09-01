import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => setIsConnected(true);
    
    ws.current.onmessage = (event) => {
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        setLastMessage(event.data);
      }
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 3000); // Reconnect
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (ws.current && isConnected) {
      ws.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, [isConnected]);

  return { isConnected, lastMessage, send };
}
