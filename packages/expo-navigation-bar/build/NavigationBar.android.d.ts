import type { EventSubscription } from 'expo-modules-core';
import type { NavigationBarProps, NavigationBarStyle, NavigationBarVisibility, NavigationBarVisibilityEvent } from './NavigationBar.types';
export declare function setStyle(style: NavigationBarStyle): void;
export declare function NavigationBar({ style, hidden }: NavigationBarProps): null;
export declare namespace NavigationBar {
    var setStyle: typeof import("./NavigationBar.android").setStyle;
    var setHidden: (hidden: boolean) => void;
}
export declare function addVisibilityListener(listener: (event: NavigationBarVisibilityEvent) => void): EventSubscription;
export declare function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void>;
export declare function getVisibilityAsync(): Promise<NavigationBarVisibility>;
export declare function useVisibility(): NavigationBarVisibility | null;
//# sourceMappingURL=NavigationBar.android.d.ts.map