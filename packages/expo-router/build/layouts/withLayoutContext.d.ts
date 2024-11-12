import { EventMapBase, NavigationState } from '@react-navigation/native';
import React, { ComponentType, ReactNode } from 'react';
import { PickPartial } from '../types';
import { ScreenProps } from '../useScreens';
export declare function useFilterScreenChildren(children: ReactNode, { isCustomNavigator, contextKey, }?: {
    isCustomNavigator?: boolean;
    /** Used for sending developer hints */
    contextKey?: string;
}): {
    screens: any[] | null | undefined;
    children: any[];
};
/**
 * Returns a navigator that automatically injects matched routes and renders nothing when there are no children.
 * Return type with `children` prop optional.
 */
export declare function withLayoutContext<TOptions extends object, T extends ComponentType<any>, TState extends NavigationState, TEventMap extends EventMapBase>(Nav: T, processor?: (options: ScreenProps<TOptions, TState, TEventMap>[]) => ScreenProps<TOptions, TState, TEventMap>[]): React.ForwardRefExoticComponent<React.PropsWithoutRef<PickPartial<React.ComponentProps<T>, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: ScreenProps<TOptions, TState, TEventMap>) => null;
};
//# sourceMappingURL=withLayoutContext.d.ts.map