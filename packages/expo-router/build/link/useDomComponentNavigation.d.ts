import type { RouterStore } from '../global-state/router-store';
import type { LinkToOptions } from '../global-state/routing';
export declare function emitDomSetParams(params?: Record<string, string | number | (string | number)[]>): boolean;
export declare function emitDomDismiss(count?: number): boolean;
export declare function emitDomGoBack(): boolean;
export declare function emitDomDismissAll(): boolean;
export declare function emitDomLinkEvent(href: string, options: LinkToOptions): boolean;
export declare function useDomComponentNavigation(store: RouterStore): void;
//# sourceMappingURL=useDomComponentNavigation.d.ts.map