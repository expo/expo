import { LinkProps } from '../useLinkHooks';
export declare function useZoomTransitionPrimitives({ href, asChild }: LinkProps): {
    zoomTransitionSourceContextValue: {
        identifier: string;
        addSource: () => void;
        removeSource: () => void;
        canAddSource: boolean;
    } | undefined;
    href: string | import("../..").HrefObject;
};
//# sourceMappingURL=useZoomTransitionPrimitives.ios.d.ts.map