import { EventBus } from './eventBus';
import { ErrorHandler } from './errorHandler';

export type ConnectionType = 'bluetooth' | 'wifi' | 'internet' | 'mesh' | 'offline';

export interface ConnectionStatus {
  type: ConnectionType;
  connected: boolean;
  peerCount: number;
  signalStrength: number;
  latency: number;
  bandwidth: number;
}

class ConnectionManagerClass {
  private status: ConnectionStatus = {
    type: 'offline',
    connected: false,
    peerCount: 0,
    signalStrength: 0,
    latency: 0,
    bandwidth: 0,
  };
  
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      this.startMonitoring();
      await this.connect();
      this.isInitialized = true;
      this.emitStatusChange();
      console.log('[ConnectionManager] Initialized');
    } catch (error) {
      ErrorHandler.handle(error, 'CONNECTION_INIT');
      throw error;
    }
  }

  async connect(): Promise<void> {
    try {
      const connectionTypes: ConnectionType[] = ['mesh', 'wifi', 'bluetooth', 'internet'];
      for (const type of connectionTypes) {
        const connected = await this.tryConnect(type);
        if (connected) {
          this.status.type = type;
          this.status.connected = true;
          this.emitStatusChange();
          console.log(`[ConnectionManager] Connected via ${type}`);
          return;
        }
      }
      this.status.type = 'offline';
      this.status.connected = false;
      this.emitStatusChange();
      this.scheduleReconnect();
    } catch (error) {
      ErrorHandler.handle(error, 'CONNECT');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.status.type = 'offline';
    this.status.connected = false;
    this.emitStatusChange();
    console.log('[ConnectionManager] Disconnected');
  }

  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    await this.disconnect();
    await this.connect();
  }

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  isHealthy(): boolean {
    return this.isInitialized && this.status.connected;
  }

  private async tryConnect(type: ConnectionType): Promise<boolean> {
    try {
      switch (type) {
        case 'mesh': return await this.connectMesh();
        case 'wifi': return await this.connectWiFi();
        case 'bluetooth': return await this.connectBluetooth();
        case 'internet': return await this.connectInternet();
        default: return false;
      }
    } catch (error) {
      console.warn(`[ConnectionManager] Failed to connect via ${type}:`, error);
      return false;
    }
  }

  private async connectMesh(): Promise<boolean> {
    // In production: actual mesh connection
    return true;
  }

  private async connectWiFi(): Promise<boolean> {
    return false;
  }

  private async connectBluetooth(): Promise<boolean> {
    return false;
  }

  private async connectInternet(): Promise<boolean> {
    return false;
  }

  private startMonitoring(): void {
    setInterval(() => this.updateStatus(), 5000);
  }

  private async updateStatus(): Promise<void> {
    try {
      this.status.peerCount = Math.floor(Math.random() * 10);
      this.status.signalStrength = -50 - Math.floor(Math.random() * 40);
      this.emitStatusChange();
    } catch (error) {
      console.warn('[ConnectionManager] Status update failed:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[ConnectionManager] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    setTimeout(async () => {
      console.log(`[ConnectionManager] Reconnect attempt ${this.reconnectAttempts}`);
      await this.connect();
    }, 5000 * this.reconnectAttempts);
  }

  private emitStatusChange(): void {
    EventBus.publish('connection:changed', this.status);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
    this.isInitialized = false;
    console.log('[ConnectionManager] Shutdown');
  }
}

export const ConnectionManager = new ConnectionManagerClass();