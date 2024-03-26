import type { UpdatesNativeStateChangeEvent } from './Updates.types';
/**
 * Add listener for state change events
 * @hidden
 */
export declare const addUpdatesStateChangeListener: (listener: (event: UpdatesNativeStateChangeEvent) => void) => import("fbemitter").EventSubscription;
/**
 * Allows JS to emit a simulated native state change event (used in unit testing)
 * @hidden
 */
export declare const emitTestStateChangeEvent: (event: UpdatesNativeStateChangeEvent) => void;
//# sourceMappingURL=UpdatesEmitter.d.ts.map