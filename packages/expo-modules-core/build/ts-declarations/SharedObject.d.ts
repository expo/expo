import type { EventEmitter, EventsMap } from './EventEmitter';
/**
 * Base class for all shared objects that extends the {@link EventEmitter} class.
 * The implementation is written in C++, installed through JSI and common for mobile platforms.
 */
export declare class SharedObject<TEventsMap extends EventsMap = Record<never, never>> extends EventEmitter<TEventsMap> implements EventEmitter<TEventsMap> {
    /**
     * A function that detaches the JS and native objects to let the native object deallocate
     * before the JS object gets deallocated by the JS garbage collector. Any subsequent calls to native
     * functions of the object will throw an error as it is no longer associated with its native counterpart.
     *
     * In most cases, you should never need to use this function, except some specific performance-critical cases when
     * manual memory management makes sense and the native object is known to exclusively retain some native memory
     * (such as binary data or image bitmap). Before calling this function, you should ensure that nothing else will use
     * this object later on. Shared objects created by React hooks are usually automatically released in the effect's cleanup phase,
     * for example: `useVideoPlayer()` from `expo-video` and `useImage()` from `expo-image`.
     */
    release(): void;
}
//# sourceMappingURL=SharedObject.d.ts.map