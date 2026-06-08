import type { NavigatorState } from 'standard-navigation';
import { type DrawerStatus } from '../../native';
import type { DrawerDescriptorMap, DrawerEmit, DrawerNavigationActions, DrawerNavigationConfig } from '../types';
type Props = DrawerNavigationConfig & DrawerNavigationActions & {
    defaultStatus: DrawerStatus;
    state: NavigatorState;
    descriptors: DrawerDescriptorMap;
    /** Current drawer status, derived from the navigator state in `createProps`. */
    drawerStatus: DrawerStatus;
    /** Keys of routes that have been preloaded, derived from the navigator state in `createProps`. */
    preloadedRouteKeys: readonly string[];
    /** The navigator's state key, used as the target for emitted navigator-level events. */
    navigatorKey: string;
    isFocused: () => boolean;
    emit: DrawerEmit;
    /** Pops the previous route's nested stack to top on blur (needs raw nested state, lives in `createProps`). */
    handlePopToTopOnBlur: (routeKey: string) => void;
};
export declare function DrawerView(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DrawerView.d.ts.map