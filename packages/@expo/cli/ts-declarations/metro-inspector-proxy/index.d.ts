declare module 'metro-inspector-proxy' {
  import { Server } from 'metro';
  import http from 'http';
  import https from 'https';
  export class InspectorProxy {
    constructor(projectRoot: string);
    processRequest(req: http.IncomingMessage, res: http.ServerResponse, next: () => void): void;
    createWebSocketListeners<T>(server: T): T;
  }
}
