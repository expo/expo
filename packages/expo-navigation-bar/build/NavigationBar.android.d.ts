import { type EventSubscription } from 'expo-modules-core';
import type { NavigationBarStyle, NavigationBarVisibility, NavigationBarVisibilityEvent } from './NavigationBar.types';
export declare function addVisibilityListener(listener: (event: NavigationBarVisibilityEvent) => void): EventSubscription;
export declare function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void>;
export declare function getVisibilityAsync(): Promise<NavigationBarVisibility>;
export declare function setStyle(style: NavigationBarStyle): void;
export declare function useVisibility(): NavigationBarVisibility | null;
//# sourceMappingURL=NavigationBar.android.d.ts.map