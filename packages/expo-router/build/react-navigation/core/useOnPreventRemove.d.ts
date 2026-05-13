import type { NavigationAction, NavigationState } from '../routers';
import { type ChildBeforeRemoveListener } from './NavigationBuilderContext';
import type { EventMapCore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
type Options = {
    getState: () => NavigationState;
    emitter: NavigationEventEmitter<EventMapCore<any>>;
    beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>;
};
export declare const shouldPreventRemove: (emitter: NavigationEventEmitter<EventMapCore<any>>, beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>, currentRoutes: {
    key: string;
}[], nextRoutes: {
    key?: string | undefined;
}[], action: NavigationAction) => boolean;
export declare function useOnPreventRemove({ getState, emitter, beforeRemoveListeners }: Options): void;
export {};
//# sourceMappingURL=useOnPreventRemove.d.ts.map