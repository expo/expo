/// <reference types="react" />
export type RedirectConfig = {
    source: string;
    destination: string;
};
export declare function redirectModule(redirect: RedirectConfig): {
    default: () => import("react").JSX.Element;
};
//# sourceMappingURL=getRoutesRedirects.d.ts.map