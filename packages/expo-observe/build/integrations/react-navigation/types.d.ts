import type { NavigationRoute, NavigationState } from '@react-navigation/native';
export type NavigationRouteLike = NavigationRoute<any, string> & {
    state: NavigationState;
};
export type NavigationStateLike = NavigationState;
export type GetPathname = (state: NavigationStateLike | undefined) => string | undefined;
//# sourceMappingURL=types.d.ts.map