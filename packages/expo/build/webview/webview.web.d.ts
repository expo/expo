type BridgeMessage<T> = {
    type: string;
    data: T;
};
export declare const emit: <T>(message: BridgeMessage<T>) => void;
export declare const useBridge: <T>(onSubscribe: (message: BridgeMessage<T>) => void) => {}[];
export {};
//# sourceMappingURL=webview.web.d.ts.map