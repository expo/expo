/// <reference types="../types/expo-router" />
import type { RouterStore } from './router-store';
export declare function navigate(this: RouterStore, url: ExpoRouter.Href): any;
export declare function push(this: RouterStore, url: ExpoRouter.Href): any;
export declare function replace(this: RouterStore, url: ExpoRouter.Href): any;
export declare function goBack(this: RouterStore): void;
export declare function canGoBack(this: RouterStore): boolean;
export declare function setParams(this: RouterStore, params?: Record<string, string | number>): any;
export declare function linkTo(this: RouterStore, href: string, event?: string): void;
//# sourceMappingURL=routing.d.ts.map