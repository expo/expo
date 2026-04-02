import type { NavigationState, ParamListBase } from '../routers';
import type { Descriptor, NavigationHelpers, NavigationProp, RouteProp } from './types';
type Options = {
    state: NavigationState;
    navigation: NavigationHelpers<ParamListBase>;
    descriptors: Record<string, Descriptor<object, NavigationProp<ParamListBase>, RouteProp<ParamListBase>>>;
};
/**
 * Write the current options, so that server renderer can get current values
 * Mutating values like this is not safe in async mode, but it doesn't apply to SSR
 */
export declare function useCurrentRender({ state, navigation, descriptors }: Options): void;
export {};
//# sourceMappingURL=useCurrentRender.d.ts.map