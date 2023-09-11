import { getActionFromState } from '@react-navigation/core';
import type { RouterStore } from './router-store';
import { Href } from '../link/href';
import { NavigateAction } from '../link/stateOperations';
export declare function push(this: RouterStore, url: Href): any;
export declare function replace(this: RouterStore, url: Href): any;
export declare function goBack(this: RouterStore): void;
export declare function canGoBack(this: RouterStore): boolean;
export declare function setParams(this: RouterStore, params?: Record<string, string | number>): any;
export declare function linkTo(this: RouterStore, href: string, event?: string): void;
/** @returns `true` if the action is moving to the first screen of all the navigators in the action. */
export declare function isAbsoluteInitialRoute(action: ReturnType<typeof getActionFromState>): action is NavigateAction;
//# sourceMappingURL=routing.d.ts.map