export interface MetroInspectorProxyApp {
    description: string;
    devtoolsFrontendUrl: string;
    faviconUrl: string;
    id: string;
    title: string;
    type: 'node';
    vm: 'Hermes' | "don't use";
    webSocketDebuggerUrl: string;
}
export declare function openJsInspector(app: MetroInspectorProxyApp): Promise<void>;
export declare function closeJsInspector(): Promise<void>;
export declare function queryInspectorAppAsync(metroServerOrigin: string, appId: string): Promise<MetroInspectorProxyApp | null>;
export declare function queryAllInspectorAppsAsync(metroServerOrigin: string): Promise<MetroInspectorProxyApp[]>;
