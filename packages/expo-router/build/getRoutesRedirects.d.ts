/// <reference types="react" />
import { RedirectConfig } from './getRoutesCore';
export declare function getRedirectModule(route: string): {
    default: () => import("react").CElement<{
        href: string;
    }, import("react").Component<{
        href: string;
    }, any, any>>;
};
export declare function convertRedirect(path: string, config: RedirectConfig): string;
export declare function mergeVariablesWithPath(path: string, params: Record<string, string | string[]>): string;
//# sourceMappingURL=getRoutesRedirects.d.ts.map