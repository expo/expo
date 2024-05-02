import type { EventEmitter, EventsMap } from './EventEmitter';
/**
 * Base class for all shared objects that extends the EventEmitter class.
 * The implementation is written in C++, installed through JSI and common for mobile platforms.
 */
export declare class SharedObject<TEventsMap extends EventsMap = Record<never, never>> extends EventEmitter<TEventsMap> {
    /**
     * A function that detaches the JS and native objects to let the native object deallocate
     * before the JS object gets deallocated by the JS garbagge collector. Any subsequent calls to native
     * functions of the object will throw an error as it is no longer associated with its native counterpart.
     */
    release(): void;
}
//# sourceMappingURL=SharedObject.d.ts.map