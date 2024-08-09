import type { EventEmitter } from './eventemitter3';
export type HMRConnectionEvent = 'open' | 'close' | 'connection-error';
export type HMRMessageEvent = 'bundle-registered' | 'update-start' | 'update' | 'update-done' | 'error';
interface HMRClientStatic {
    new (url: string): HMRClientInstance;
}
interface HMRClientInstance extends EventEmitter<HMRMessageEvent | HMRConnectionEvent> {
    close(): void;
    send(message: string): void;
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
    hasPendingUpdates(): boolean;
}
export declare const HMRClient: HMRClientStatic;
export {};
