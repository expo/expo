import type { ParamListBase } from '../routers';
import type { NavigationContainerRefWithCurrent } from './types';
export declare const NOT_INITIALIZED_ERROR = "The 'navigation' object hasn't been initialized yet. This might happen if you don't have a navigator mounted, or if the navigator hasn't finished mounting. See https://reactnavigation.org/docs/navigating-without-navigation-prop#handling-initialization for more details.";
export declare function createNavigationContainerRef<ParamList extends ParamListBase = ReactNavigation.RootParamList>(): NavigationContainerRefWithCurrent<ParamList>;
//# sourceMappingURL=createNavigationContainerRef.d.ts.map