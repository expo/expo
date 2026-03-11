import type { ZoomTransitionEnablerProps } from './ZoomTransitionEnabler.types';
import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME, INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../../navigationParams';
export declare function disableZoomTransition(): void;
export declare function isZoomTransitionEnabled(): boolean;
export declare function ZoomTransitionEnabler({ route }: ZoomTransitionEnablerProps): import("react").JSX.Element | null;
/**
 * @internal
 */
export declare function useShouldEnableZoomTransition(route: unknown): route is {
    key: string;
    params: {
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: string;
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: string;
    };
};
//# sourceMappingURL=ZoomTransitionEnabler.ios.d.ts.map