import * as React from 'react';
import type { NavigationState, PartialState } from '../routers';
export declare const NavigationStateContext: React.Context<{
    isDefault?: true;
    state?: NavigationState | PartialState<NavigationState>;
    getKey: () => string | undefined;
    setKey: (key: string) => void;
    getState: () => NavigationState | PartialState<NavigationState> | undefined;
    setState: (state: NavigationState | PartialState<NavigationState> | undefined) => void;
    getIsInitial: () => boolean;
    addOptionsGetter?: (key: string, getter: () => object | undefined | null) => void;
}>;
//# sourceMappingURL=NavigationStateContext.d.ts.map