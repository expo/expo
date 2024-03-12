import { ExpoGlobal } from '..';
import { EventEmitter } from '../ts-declarations/EventEmitter';
import { NativeModule } from '../ts-declarations/NativeModule';
import { SharedObject } from '../ts-declarations/SharedObject';
declare class WebEventEmitter<TEventsMap extends Record<never, never>> implements EventEmitter {
    private listeners;
    constructor();
    removeListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): void;
    removeAllListeners<EventName extends keyof TEventsMap>(eventName: EventName): void;
    emit<EventName extends keyof TEventsMap>(eventName: EventName, ...args: Parameters<TEventsMap[EventName]>): void;
    addListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): void;
}
declare class CoreObject implements ExpoGlobal {
    modules: Record<string, any>;
    EventEmitter: typeof WebEventEmitter;
    SharedObject: typeof SharedObject;
    NativeModule: typeof NativeModule;
    constructor();
    getViewConfig(viewName: string): {
        validAttributes: Record<string, any>;
        directEventTypes: Record<string, {
            registrationName: string;
        }>;
    } | null;
    uuidv4(): string;
    uuidv5(name: string, namespace: string | number[]): string;
}
export default CoreObject;
//# sourceMappingURL=CoreModule.d.ts.map