import { EventMapBase, NavigationState } from '@react-navigation/native';
import { ComponentProps, ComponentType, ForwardRefExoticComponent, PropsWithoutRef, ReactNode, RefAttributes } from 'react';
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
/** Return a navigator that automatically injects matched routes and renders nothing when there are no children. Return type with children prop optional */
export declare function withLayoutContext<TOptions extends object, T extends ComponentType<any>, State extends NavigationState, EventMap extends EventMapBase>(Nav: T, processor?: (options: ScreenProps<TOptions, State, EventMap>[]) => ScreenProps<TOptions, State, EventMap>[]): ForwardRefExoticComponent<PropsWithoutRef<PickPartial<ComponentProps<T>, 'children'>> & RefAttributes<unknown>> & {
    Screen: (props: ScreenProps<TOptions, State, EventMap>) => null;
};
//# sourceMappingURL=withLayoutContext.d.ts.map