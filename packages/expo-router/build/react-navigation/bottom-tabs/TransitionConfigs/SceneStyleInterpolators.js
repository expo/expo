"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forFade = forFade;
exports.forShift = forShift;
/**
 * Simple cross fade animation
 */
function forFade({ current, }) {
    return {
        sceneStyle: {
            opacity: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 1, 0],
            }),
        },
    };
}
/**
 * Animation where the screens slightly shift to left/right
 */
function forShift({ current, }) {
    return {
        sceneStyle: {
            opacity: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 1, 0],
            }),
            transform: [
                {
                    translateX: current.progress.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [-50, 0, 50],
                    }),
                },
            ],
        },
    };
}
//# sourceMappingURL=SceneStyleInterpolators.js.map