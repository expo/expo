import type EventEmitter from 'eventemitter3';
export type HMRConnectionEvent = 'open' | 'close' | 'connection-error';
export type HMRMessageEvent = 'bundle-registered' | 'update-start' | 'update' | 'update-done' | 'error';
type HMRClientType = new (url: string) => {
    close(): void;
    send(message: string): void;
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
    hasPendingUpdates(): boolean;
} & EventEmitter<HMRMessageEvent | HMRConnectionEvent>;
export declare const HMRClient: HMRClientType;
export {};
