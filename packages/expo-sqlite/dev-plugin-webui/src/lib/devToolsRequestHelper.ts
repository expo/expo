/**
 * Helper for managing request/response cycles with the DevTools client.
 * Handles request IDs, timeouts, and promise resolution.
 */

import { REQUEST_TIMEOUT_MS } from './constants';

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface DevToolsClient {
  sendMessage(event: string, params: any): void;
  addMessageListener(event: string, handler: (data: any) => void): { remove: () => void };
  addMessageListenerOnce(event: string, handler: (data: any) => void): void;
}

export class DevToolsRequestHelper<TResponse = any> {
  private pendingRequests = new Map<string, PendingRequest<TResponse>>();
  private requestIdCounter = 0;
  public readonly client: DevToolsClient | null;

  constructor(client: DevToolsClient | null) {
    this.client = client;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  private createRequest(timeoutMs: number = REQUEST_TIMEOUT_MS): {
    requestId: string;
    promise: Promise<TResponse>;
  } {
    const requestId = this.generateRequestId();

    const promise = new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request ${requestId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeoutId,
      });
    });

    return { requestId, promise };
  }

  resolveRequest(requestId: string, response: TResponse): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      return false;
    }

    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(requestId);
    pending.resolve(response);
    return true;
  }

  rejectRequest(requestId: string, error: Error): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      return false;
    }

    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(requestId);
    pending.reject(error);
    return true;
  }

  clearAll(): void {
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error(`Request ${requestId} cancelled`));
    }
    this.pendingRequests.clear();
    this.responseListenerSetup = false;
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  async sendMessageAsync(method: string, params: any = {}, timeoutMs?: number): Promise<TResponse> {
    if (!this.client) {
      throw new Error('DevTools client not connected');
    }

    const { requestId, promise } = this.createRequest(timeoutMs);

    // getDatabase uses dedicated channel to support binary data
    if (method === 'getDatabase') {
      const eventName = `${method}:${requestId}`;

      this.client.addMessageListenerOnce(eventName, (response: TResponse) => {
        this.resolveRequest(requestId, response);
      });

      this.client.sendMessage(method, { ...params, requestId });
    } else {
      if (!this.responseListenerSetup) {
        this.setupResponseListener();
      }

      this.client.sendMessage(method, { ...params, requestId });
    }

    return await promise;
  }

  private responseListenerSetup = false;
  private responseListener: { remove: () => void } | null = null;

  private setupResponseListener(): void {
    if (!this.client) {
      return;
    }

    this.responseListener = this.client.addMessageListener('response', (response: any) => {
      if (response.requestId) {
        this.resolveRequest(response.requestId, response);
      }
    });

    this.responseListenerSetup = true;
  }

  dispose(): void {
    this.clearAll();
    this.responseListener?.remove();
    this.responseListener = null;
    this.responseListenerSetup = false;
  }
}
