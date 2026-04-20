import type { NavigationAction, NavigationState, PartialState, Router, RouterConfigOptions } from '../routers';
import { type ChildActionListener, type ChildBeforeRemoveListener } from './NavigationBuilderContext';
import type { EventMapCore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
type Options<State extends NavigationState> = {
    router: Router<State, NavigationAction>;
    key?: string;
    getState: () => State;
    setState: (state: State | PartialState<State>) => void;
    actionListeners: ChildActionListener[];
    beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>;
    routerConfigOptions: RouterConfigOptions;
    emitter: NavigationEventEmitter<EventMapCore<any>>;
};
/**
 * Hook to handle actions for a navigator, including state updates and bubbling.
 *
 * Bubbling an action is achieved in 2 ways:
 * 1. To bubble action to parent, we expose the action handler in context and then access the parent context
 * 2. To bubble action to child, child adds event listeners subscribing to actions from parent
 *
 * When the action handler handles as action, it returns `true`, otherwise `false`.
 */
export declare function useOnAction<State extends NavigationState>({ router, getState, setState, key, actionListeners, beforeRemoveListeners, routerConfigOptions, emitter, }: Options<State>): (action: NavigationAction, visitedNavigators?: Set<string>) => boolean;
export {};
//# sourceMappingURL=useOnAction.d.ts.map