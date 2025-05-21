import { type EventSubscription } from 'expo-modules-core';
import type { NavigationBarBehavior, NavigationBarButtonStyle, NavigationBarPosition, NavigationBarStyle, NavigationBarVisibility, NavigationBarVisibilityEvent } from './NavigationBar.types';
export declare function addVisibilityListener(listener: (event: NavigationBarVisibilityEvent) => void): EventSubscription;
export declare function setBackgroundColorAsync(color: string): Promise<void>;
export declare function getBackgroundColorAsync(): Promise<string>;
export declare function setBorderColorAsync(color: string): Promise<void>;
export declare function getBorderColorAsync(): Promise<string>;
export declare function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void>;
export declare function getVisibilityAsync(): Promise<NavigationBarVisibility>;
export declare function setButtonStyleAsync(style: NavigationBarButtonStyle): Promise<void>;
export declare function getButtonStyleAsync(): Promise<NavigationBarButtonStyle>;
export declare function setPositionAsync(position: NavigationBarPosition): Promise<void>;
export declare function unstable_getPositionAsync(): Promise<NavigationBarPosition>;
export declare function setBehaviorAsync(behavior: NavigationBarBehavior): Promise<void>;
export declare function getBehaviorAsync(): Promise<NavigationBarBehavior>;
export declare function setStyle(style: NavigationBarStyle): void;
export declare function useVisibility(): NavigationBarVisibility | null;
//# sourceMappingURL=NavigationBar.android.d.ts.map