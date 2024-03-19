import type { EventEmitter as EventEmitterType } from '../ts-declarations/EventEmitter';
import type { NativeModule as NativeModuleType } from '../ts-declarations/NativeModule';
declare class EventEmitter<TEventsMap extends Record<never, never>> implements EventEmitterType {
    private listeners?;
    removeListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): void;
    removeAllListeners<EventName extends keyof TEventsMap>(eventName: EventName): void;
    emit<EventName extends keyof TEventsMap>(eventName: EventName, ...args: Parameters<TEventsMap[EventName]>): void;
    addListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): void;
}
export declare class NativeModule<TEventsMap extends Record<never, never>> extends EventEmitter<TEventsMap> implements NativeModuleType {
    [key: string]: any;
    ViewPrototype?: object | undefined;
    __expo_module_name__?: string;
}
export {};
//# sourceMappingURL=CoreModule.d.ts.map