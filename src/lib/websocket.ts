/**
 * WebSocket Manager for Dexster
 * 
 * Connects to wss://dexster.io/ws
 * Auth: first message must be { type: "auth", token: "<wsToken>" }
 * Auto-reconnect with exponential backoff
 * Event emitter pattern for typed events
 */

type WsEventHandler = (data: any) => void;

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://dexster.io/ws';

const MIN_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export class DexsterWebSocket {
  private ws: WebSocket | null = null;
  private wsToken: string | null = null;
  private listeners = new Map<string, Set<WsEventHandler>>();
  private reconnectDelay = MIN_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isAuthenticated = false;
  private shouldReconnect = true;
  private subscriptions = new Set<string>();

  connect(token: string) {
    this.wsToken = token;
    this.shouldReconnect = true;
    this.doConnect();
  }

  disconnect() {
    this.shouldReconnect = false;
    this.isAuthenticated = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private doConnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.ws = new WebSocket(WS_URL);
    this.isAuthenticated = false;

    this.ws.onopen = () => {
      this.reconnectDelay = MIN_RECONNECT_DELAY;
      // Send auth as first message
      if (this.wsToken && this.ws) {
        this.ws.send(JSON.stringify({ type: 'auth', token: this.wsToken }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'authenticated') {
          this.isAuthenticated = true;
          this.emit('connected', {});
          // Re-subscribe to channels
          for (const channel of this.subscriptions) {
            this.ws?.send(JSON.stringify({ type: 'subscribe', channel }));
          }
          return;
        }

        if (data.type === 'auth_failed') {
          this.emit('auth_failed', data);
          this.shouldReconnect = false;
          this.ws?.close();
          return;
        }

        // Route event to listeners
        if (data.type) {
          this.emit(data.type, data);
        }
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.isAuthenticated = false;
      this.emit('disconnected', {});
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
      this.doConnect();
    }, this.reconnectDelay);
  }

  subscribe(channel: string) {
    this.subscriptions.add(channel);
    if (this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }

  unsubscribe(channel: string) {
    this.subscriptions.delete(channel);
    if (this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }

  on(event: string, handler: WsEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: WsEventHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data); } catch { /* ignore */ }
      }
    }
  }

  get connected() {
    return this.isAuthenticated;
  }
}

// Singleton instance
export const dexsterWs = new DexsterWebSocket();
