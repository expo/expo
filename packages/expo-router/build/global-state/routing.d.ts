import { type RouterStore } from './router-store';
import { Href } from '../types';
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
     *
     */
    withAnchor?: boolean;
};
export declare function linkTo(this: RouterStore, href: string, { event, relativeToDirectory, withAnchor }?: LinkToOptions): void;
//# sourceMappingURL=routing.d.ts.map