import type { DismissalBoundsRect } from './zoom-transition-context';
export interface UsePreventZoomTransitionDismissalOptions {
    /**
     * Defines the screen bounds where interactive dismissal gestures are allowed.
     *
     * Each coordinate is optional. Undefined coordinates place no restriction on that dimension.
     * For example, if only `minY` and `maxY` are defined, horizontal gestures are unrestricted
     * while vertical gestures must stay within the Y bounds.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiviewcontroller/transition/zoomoptions/interactivedismissshouldbegin) for more information.
     */
    unstable_dismissalBoundsRect?: DismissalBoundsRect;
}
//# sourceMappingURL=usePreventZoomTransitionDismissal.types.d.ts.map