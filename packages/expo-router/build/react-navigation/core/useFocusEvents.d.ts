import type { NavigationState } from '../routers';
import type { EventMapCore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
type Options<State extends NavigationState> = {
    state: State;
    emitter: NavigationEventEmitter<EventMapCore<State>>;
};
/**
 * Hook to take care of emitting `focus` and `blur` events.
 */
export declare function useFocusEvents<State extends NavigationState>({ state, emitter }: Options<State>): void;
export {};
//# sourceMappingURL=useFocusEvents.d.ts.map