import { ExpoGlobal } from '..';
import { EventEmitter } from '../ts-declarations/EventEmitter';
import { NativeModule } from '../ts-declarations/NativeModule';
import { SharedObject } from '../ts-declarations/SharedObject';
declare class WebEventEmitter implements EventEmitter {
    private listeners;
    constructor();
    removeListener<EventName, ListenerFunction extends Function>(eventName: EventName, listener: ListenerFunction): void;
    removeAllListeners<EventName>(eventName: EventName): void;
    emit<EventName, Arguments extends any[]>(eventName: EventName, ...args: Arguments): void;
    addListener<EventName, ListenerFunction extends Function>(eventName: EventName, listener: ListenerFunction): void;
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