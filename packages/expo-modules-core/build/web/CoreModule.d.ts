import { type EventEmitter as EventEmitterType, type EventSubscription, EventsMap } from '../ts-declarations/EventEmitter';
import type { NativeModule as NativeModuleType } from '../ts-declarations/NativeModule';
import type { SharedObject as SharedObjectType } from '../ts-declarations/SharedObject';
import type { SharedRef as SharedRefType } from '../ts-declarations/SharedRef';
export declare class EventEmitter<TEventsMap extends EventsMap> implements EventEmitterType {
    private listeners?;
    addListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): EventSubscription;
    removeListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): void;
    removeAllListeners<EventName extends keyof TEventsMap>(eventName: EventName): void;
    emit<EventName extends keyof TEventsMap>(eventName: EventName, ...args: Parameters<TEventsMap[EventName]>): void;
    listenerCount<EventName extends keyof TEventsMap>(eventName: EventName): number;
    startObserving<EventName extends keyof TEventsMap>(eventName: EventName): void;
    stopObserving<EventName extends keyof TEventsMap>(eventName: EventName): void;
}
export declare class NativeModule<TEventsMap extends Record<never, never>> extends EventEmitter<TEventsMap> implements NativeModuleType {
    [key: string]: any;
    ViewPrototypes?: {
        [viewName: string]: object;
    };
    __expo_module_name__?: string;
}
export declare class SharedObject<TEventsMap extends Record<never, never>> extends EventEmitter<TEventsMap> implements SharedObjectType {
    release(): void;
}
export declare class SharedRef<TNativeRefType extends string = 'unknown', TEventsMap extends EventsMap = Record<never, never>> extends SharedObject<TEventsMap> implements SharedRefType<TNativeRefType> {
    nativeRefType: string;
}
//# sourceMappingURL=CoreModule.d.ts.map