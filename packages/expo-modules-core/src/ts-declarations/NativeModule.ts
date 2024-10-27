import type { EventEmitter, EventsMap } from './EventEmitter';

/**
 * A class for all native modules. Extends the {@link EventEmitter} class.
 */
export declare class NativeModule<
  TEventsMap extends EventsMap = Record<never, never>,
> extends EventEmitter<TEventsMap> {
  /**
   * A prototype of the native component exported by the module.
   * @deprecated It will be removed in favor of another API that supports multiple components per module.
   * @private
   */
  ViewPrototype?: object;

  // Ideally if we don't have it, but not all modules have concrete types in `requireNativeModule`.
  [key: string]: any;
}
