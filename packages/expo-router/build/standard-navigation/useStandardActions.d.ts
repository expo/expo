import { type NavigatorArgs } from 'standard-navigation';
import type { StandardNavigationAction, StandardNavigatorEventMapBase } from './types';
type StandardActionHelpers = NavigatorArgs<Record<string, never>, StandardNavigatorEventMapBase>['actions'];
export declare function useStandardActions(navigation: {
    dispatch: (action: StandardNavigationAction) => void;
}, target: string): StandardActionHelpers;
export {};
//# sourceMappingURL=useStandardActions.d.ts.map