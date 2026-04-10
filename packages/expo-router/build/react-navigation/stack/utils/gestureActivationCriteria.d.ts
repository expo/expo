import type { LocaleDirection } from '../../native';
import type { GestureDirection, Layout } from '../types';
export declare const gestureActivationCriteria: ({ direction, gestureDirection, gestureResponseDistance, layout, }: {
    direction: LocaleDirection;
    gestureDirection: GestureDirection;
    gestureResponseDistance?: number;
    layout: Layout;
}) => {
    maxDeltaX: number;
    minOffsetY: number;
    hitSlop: {
        bottom: number;
        top?: undefined;
        right?: undefined;
        left?: undefined;
    };
    enableTrackpadTwoFingerGesture: boolean;
    minOffsetX?: undefined;
    maxDeltaY?: undefined;
} | {
    maxDeltaX: number;
    minOffsetY: number;
    hitSlop: {
        top: number;
        bottom?: undefined;
        right?: undefined;
        left?: undefined;
    };
    enableTrackpadTwoFingerGesture: boolean;
    minOffsetX?: undefined;
    maxDeltaY?: undefined;
} | {
    minOffsetX: number;
    maxDeltaY: number;
    hitSlop: {
        right: number;
        bottom?: undefined;
        top?: undefined;
        left?: undefined;
    };
    enableTrackpadTwoFingerGesture: boolean;
    maxDeltaX?: undefined;
    minOffsetY?: undefined;
} | {
    minOffsetX: number;
    maxDeltaY: number;
    hitSlop: {
        left: number;
        bottom?: undefined;
        top?: undefined;
        right?: undefined;
    };
    enableTrackpadTwoFingerGesture: boolean;
    maxDeltaX?: undefined;
    minOffsetY?: undefined;
};
//# sourceMappingURL=gestureActivationCriteria.d.ts.map