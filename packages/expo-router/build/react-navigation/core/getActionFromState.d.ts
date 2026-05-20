import type { CommonActions, NavigationState, PartialState } from '../routers';
import type { NavigatorScreenParams, PathConfigMap } from './types';
type Options = {
    initialRouteName?: string;
    screens: PathConfigMap<object>;
};
type NavigateAction<State extends NavigationState> = {
    type: 'NAVIGATE';
    payload: {
        name: string;
        params?: NavigatorScreenParams<State>;
        path?: string;
    };
};
export declare function getActionFromState(state: PartialState<NavigationState>, options?: Options): NavigateAction<NavigationState> | CommonActions.Action | undefined;
export {};
//# sourceMappingURL=getActionFromState.d.ts.map