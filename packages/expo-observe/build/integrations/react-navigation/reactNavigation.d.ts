import type { ComponentType } from 'react';
import type { NavigationContainerRefLike, NavigationRouteLike, NavigationStateLike } from './types';
interface OptionalReactNavigation {
    NavigationContainer?: ComponentType<Record<string, unknown> & {
        ref?: unknown;
    }>;
    useNavigation(): Pick<NavigationContainerRefLike, 'isFocused'>;
    useNavigationContainerRef(): NavigationContainerRefLike;
    useRoute(): NavigationRouteLike;
    useStateForPath(): NavigationStateLike | undefined;
}
declare let optionalReactNavigation: OptionalReactNavigation | undefined;
declare const isReactNavigationInstalled: boolean;
export { optionalReactNavigation, isReactNavigationInstalled };
//# sourceMappingURL=reactNavigation.d.ts.map