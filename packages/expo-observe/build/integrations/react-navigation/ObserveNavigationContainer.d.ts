import { type ComponentProps } from 'react';
import type { NavigationContainerRefLike } from './types';
declare const NavigationContainer: import("react").ComponentType<Record<string, unknown> & {
    ref?: unknown;
}> | undefined;
type NavigationContainerProps = ComponentProps<NonNullable<typeof NavigationContainer>>;
export type ObserveNavigationContainerProps = NavigationContainerProps;
export declare const ObserveNavigationContainer: import("react").ForwardRefExoticComponent<Omit<Record<string, unknown> & {
    ref?: unknown;
}, "ref"> & import("react").RefAttributes<NavigationContainerRefLike>>;
export {};
//# sourceMappingURL=ObserveNavigationContainer.d.ts.map