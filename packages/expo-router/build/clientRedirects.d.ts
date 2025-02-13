/// <reference types="react" />
import { RedirectConfig } from './getRoutesCore';
export declare function getRedirectModule(route: string): {
    default: () => import("react").FunctionComponentElement<import("./link/Link").RedirectProps>;
};
export declare function convertRedirect(path: string, config: RedirectConfig): string;
//# sourceMappingURL=clientRedirects.d.ts.map