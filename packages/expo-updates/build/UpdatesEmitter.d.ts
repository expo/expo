import type { UpdatesNativeStateChangeEvent, UpdatesNativeStateMachineContext } from './Updates.types';
export declare let latestContext: UpdatesNativeStateMachineContext;
/**
 * Add listener for state change events
 * @hidden
 */
export declare const addUpdatesStateChangeListener: (listener: (event: UpdatesNativeStateChangeEvent) => void) => import("fbemitter").EventSubscription;
/**
 * Allows JS test to emit a simulated native state change event (used in unit testing)
 * @hidden
 */
export declare const emitTestStateChangeEvent: (event: UpdatesNativeStateChangeEvent) => void;
/**
 * Allows JS test to reset latest context (and sequence number)
 * @hidden
 */
export declare const resetLatestContext: () => void;
//# sourceMappingURL=UpdatesEmitter.d.ts.map