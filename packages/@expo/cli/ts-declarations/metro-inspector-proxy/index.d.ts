declare module 'metro-inspector-proxy' {
  export class InspectorProxy {
    constructor(projectRoot: string);

    createWebSocketListeners<T>(server: T): T;

    processRequest: (req: any, res: any, next: any) => void;
  }
}
