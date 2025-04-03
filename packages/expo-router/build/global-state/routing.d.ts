import { type RouterStore } from './router-store';
import { Href } from '../types';
import { SingularOptions } from '../useScreens';
export type NavigationOptions = Omit<LinkToOptions, 'event'>;
export declare function navigate(this: RouterStore, url: Href, options?: NavigationOptions): any;
export declare function reload(this: RouterStore): void;
export declare function push(this: RouterStore, url: Href, options?: NavigationOptions): any;
export declare function dismiss(this: RouterStore, count?: number): void;
export declare function dismissTo(this: RouterStore, href: Href, options?: NavigationOptions): any;
export declare function replace(this: RouterStore, url: Href, options?: NavigationOptions): any;
export declare function dismissAll(this: RouterStore): void;
export declare function goBack(this: RouterStore): void;
export declare function canGoBack(this: RouterStore): boolean;
export declare function canDismiss(this: RouterStore): boolean;
export declare function setParams(this: RouterStore, params?: Record<string, string | number | (string | number)[]>): any;
export type LinkToOptions = {
    event?: string;
    /**
     * Relative URL references are either relative to the directory or the document. By default, relative paths are relative to the document.
     * @see: [MDN's documentation on Resolving relative references to a URL](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references).
     */
    relativeToDirectory?: boolean;
    /**
     * Include the anchor when navigating to a new navigator
     */
    withAnchor?: boolean;
    /**
     * When navigating in a Stack, remove all screen from the history that match the singular condition
     *
     * If used with `push`, the history will be filtered even if no navigation occurs.
     */
    dangerouslySingular?: SingularOptions;
};
export declare function linkTo(this: RouterStore, originalHref: string, options?: LinkToOptions): void;
//# sourceMappingURL=routing.d.ts.map