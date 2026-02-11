import { type PropsWithChildren } from 'react';
export interface LinkAppleZoomProps extends PropsWithChildren {
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
/**
 * When this component is used inside a Link, [zoom transition](https://developer.apple.com/documentation/uikit/enhancing-your-app-with-fluid-transitions?language=objc)
 * will be used when navigating to the link's href.
 *
 * @platform ios 18+
 */
export declare function LinkAppleZoom(props: LinkAppleZoomProps): import("react").JSX.Element;
//# sourceMappingURL=link-apple-zoom.d.ts.map