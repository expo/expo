import type { NavigationState } from '../routers';
import { type GetStateListener } from './NavigationBuilderContext';
type Options = {
    getState: () => NavigationState;
    getStateListeners: Record<string, GetStateListener | undefined>;
};
export declare function useOnGetState({ getState, getStateListeners }: Options): void;
export {};
//# sourceMappingURL=useOnGetState.d.ts.map