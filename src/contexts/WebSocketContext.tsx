import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { dexsterWs, DexsterWebSocket } from '@/lib/websocket';
import { useAuth } from '@/contexts/AuthContext';

interface WebSocketContextValue {
  ws: DexsterWebSocket;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  ws: dexsterWs,
  subscribe: () => {},
  unsubscribe: () => {},
  on: () => {},
  off: () => {},
  connected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wsToken, isAuthenticated } = useAuth();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && wsToken) {
      dexsterWs.connect(wsToken);
      connectedRef.current = true;
    }
    return () => {
      if (connectedRef.current) {
        dexsterWs.disconnect();
        connectedRef.current = false;
      }
    };
  }, [wsToken, isAuthenticated]);

  const subscribe = useCallback((channel: string) => dexsterWs.subscribe(channel), []);
  const unsubscribe = useCallback((channel: string) => dexsterWs.unsubscribe(channel), []);
  const on = useCallback((event: string, handler: (data: any) => void) => dexsterWs.on(event, handler), []);
  const off = useCallback((event: string, handler: (data: any) => void) => dexsterWs.off(event, handler), []);

  return (
    <WebSocketContext.Provider value={{
      ws: dexsterWs,
      subscribe,
      unsubscribe,
      on,
      off,
      connected: dexsterWs.connected,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
