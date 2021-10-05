declare global {
    interface Window {
        attachEvent(event: string, listener: EventListener): boolean;
    }
}
export declare const isDOMAvailable: boolean;
export declare const canUseEventListeners: boolean;
export declare const canUseViewport: boolean;
export declare const isAsyncDebugging = false;
