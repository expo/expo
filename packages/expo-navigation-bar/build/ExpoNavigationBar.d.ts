import type { EventSubscription } from 'expo-modules-core';
import type { NavigationBarVisibility, NavigationBarVisibilityEvent } from './NavigationBar.types';
declare const _default: {
    addListener: (event: "ExpoNavigationBar.didChange", listener: (event: NavigationBarVisibilityEvent) => void) => EventSubscription;
    setStyle: (style: "light" | "dark") => Promise<void>;
    setHidden: (hidden: boolean) => Promise<void>;
    getVisibilityAsync: () => Promise<NavigationBarVisibility>;
};
export default _default;
//# sourceMappingURL=ExpoNavigationBar.d.ts.map