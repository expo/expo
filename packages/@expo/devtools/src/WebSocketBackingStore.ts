/**
 * The backing store for the WebSocket connection and reference count.
 * This is used for connection multiplexing.
 */
export class WebSocketBackingStore {
  constructor(
    public ws: WebSocket | null = null,
    public refCount: number = 0
  ) {}
}
