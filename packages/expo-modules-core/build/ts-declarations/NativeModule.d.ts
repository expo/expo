import type { EventEmitter, EventsMap } from './EventEmitter';
/**
 * A class for all native modules. Extends the {@link EventEmitter} class.
 */
export declare class NativeModule<TEventsMap extends EventsMap = Record<never, never>> extends EventEmitter<TEventsMap> {
    /**
     * Prototypes of the native components exported by the module.
     * @private
     */
    ViewPrototypes?: {
        [viewName: string]: object;
    };
    [key: string]: any;
}
//# sourceMappingURL=NativeModule.d.ts.map