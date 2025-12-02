import { type PropsWithChildren } from 'react';
export type ZoomTransitionSourceContextValueType = {
    identifier: string;
    addSource: () => void;
    removeSource: () => void;
} | undefined;
export declare const ZoomTransitionSourceContext: import("react").Context<ZoomTransitionSourceContextValueType>;
export declare const ZoomTransitionTargetContext: import("react").Context<{
    identifier: string | null;
}>;
export declare function ZoomTransitionTargetContextProvider({ route, children, }: PropsWithChildren<{
    route: unknown;
}>): string | number | bigint | boolean | Iterable<import("react").ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
//# sourceMappingURL=zoom-transition-context.d.ts.map