import type { EventsMap } from './EventEmitter';
import type { SharedObject } from './SharedObject';

/**
 * A {@link SharedObject} that holds a reference to any native object. Allows passing references
 * to native instances among different independent libraries.
 */
export declare class SharedRef<TEventsMap extends EventsMap = Record<never, never>>
  extends SharedObject<TEventsMap>
  implements SharedObject<TEventsMap> {}
