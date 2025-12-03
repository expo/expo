import { ExpoModifier } from '../../types';
import { NativeSyntheticEvent } from 'react-native';
export type NavigationDrawerProps = {
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
    children: React.ReactNode;
    enabled: boolean;
    onDrawerStateChange: (enabled: boolean) => void;
};
type NativeNavigationDrawerProps = Omit<NavigationDrawerProps, 'onDrawerStateChange'> & {
    onDrawerStateChange: (event: NativeSyntheticEvent<{
        enabled: boolean;
    }>) => void;
};
/**
 * @hidden
 */
export declare function transformNavigationDrawerProps(props: NavigationDrawerProps): NativeNavigationDrawerProps;
/**
 * Renders a `NavigationDrawer` component.
 */
export declare function NavigationDrawer(props: NavigationDrawerProps): import("react").JSX.Element;
type NavigationDrawerItemProps = {
    onItemClick: () => void;
    selected: boolean;
    children: React.ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
type NativeNavigationDrawerItemProps = NavigationDrawerItemProps;
export declare function transformNavigationDrawerItemProps(props: NavigationDrawerItemProps): NativeNavigationDrawerItemProps;
/**
 * Renders a `NavigationDrawer` component.
 */
export declare function NavigationDrawerItem(props: NavigationDrawerItemProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map