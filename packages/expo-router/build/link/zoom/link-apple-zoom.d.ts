import { type PropsWithChildren } from 'react';
interface LinkAppleZoomProps extends PropsWithChildren {
    /**
     * Defines the rectangle used for the zoom transition's alignment. This rectangle is specified in the zoomed screen's coordinate space.
     *
     * @platform ios 18+
     */
    alignmentRect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export declare function LinkAppleZoom({ children, alignmentRect }: LinkAppleZoomProps): string | number | bigint | boolean | Iterable<import("react").ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
export {};
//# sourceMappingURL=link-apple-zoom.d.ts.map