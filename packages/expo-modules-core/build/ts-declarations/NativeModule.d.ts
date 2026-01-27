import type { EventEmitter, EventsMap } from './EventEmitter';
/**
 * A class for all native modules. Extends the [`EventEmitter`](#eventemittertype) class.
 */
export declare class NativeModule<TEventsMap extends EventsMap = Record<never, never>> extends EventEmitter<TEventsMap> {
    /**
     * Prototypes of the native components exported by the module.
     * @private
     */
    ViewPrototypes?: {
        [viewName: string]: object;
    };
}
//# sourceMappingURL=NativeModule.d.ts.map