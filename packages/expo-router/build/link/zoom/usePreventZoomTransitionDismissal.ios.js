"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePreventZoomTransitionDismissal = usePreventZoomTransitionDismissal;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const zoom_transition_context_1 = require("./zoom-transition-context");
const descriptors_context_1 = require("../../fork/native-stack/descriptors-context");
const navigationParams_1 = require("../../navigationParams");
const useNavigation_1 = require("../../useNavigation");
const stack_1 = require("../../utils/stack");
const stackPresentation_1 = require("../../utils/stackPresentation");
const useSafeLayoutEffect_1 = require("../../views/useSafeLayoutEffect");
const PreviewRouteContext_1 = require("../preview/PreviewRouteContext");
function usePreventZoomTransitionDismissal(options) {
    const context = (0, react_1.use)(zoom_transition_context_1.ZoomTransitionTargetContext);
    const route = (0, native_1.useRoute)();
    const navigation = (0, useNavigation_1.useNavigation)();
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    const isFocused = navigation.isFocused();
    const isPreloaded = isPreview ? false : (0, stack_1.isRoutePreloadedInStack)(navigation.getState(), route);
    const descriptorsMap = (0, react_1.use)(descriptors_context_1.DescriptorsContext);
    const currentDescriptor = descriptorsMap[route.key];
    const gestureEnabled = currentDescriptor?.options?.gestureEnabled;
    const isModal = (0, stackPresentation_1.isModalPresentation)(currentDescriptor?.options);
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        if (isPreview)
            return;
        if (isModal) {
            console.warn('[expo-router] usePreventZoomTransitionDismissal has no effect on screens presented modally. Please remove this hook from the screen component or change the screen presentation to a non-modal style.');
            return;
        }
        if (!context.hasEnabler) {
            return;
        }
        const rect = options?.unstable_dismissalBoundsRect;
        // Validate rect if provided
        if (rect) {
            const { minX, maxX, minY, maxY } = rect;
            // Validate that max > min when both are defined
            if (minX !== undefined && maxX !== undefined && minX >= maxX) {
                console.warn('[expo-router] unstable_dismissalBoundsRect: minX must be less than maxX');
                return;
            }
            if (minY !== undefined && maxY !== undefined && minY >= maxY) {
                console.warn('[expo-router] unstable_dismissalBoundsRect: minY must be less than maxY');
                return;
            }
        }
        // Determine the final rect to use for dismissal bounds:
        // 1. If user provided a rect, use it
        // 2. If user disabled gestures entirely (gestureEnabled={false}), block the whole screen
        //    by setting impossible bounds { maxX: 0, maxY: 0 }
        // 3. Otherwise, allow normal dismissal (null rect)
        const computedRect = rect ?? (gestureEnabled === false ? { maxX: 0, maxY: 0 } : null);
        context.setDismissalBoundsRect?.(computedRect);
        if (!isPreloaded || (isPreloaded && isFocused)) {
            // Disable React Navigation's gesture handler when we have custom bounds to prevent conflicts.
            // The native zoom transition's interactiveDismissShouldBegin callback handles dismissal instead.
            // We use the internal option to preserve the user's gestureEnabled setting.
            navigation.setOptions({
                [navigationParams_1.INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]: computedRect ? false : undefined,
            });
        }
        // Cleanup on unmount
        return () => {
            context.setDismissalBoundsRect?.(null);
        };
    }, [
        options?.unstable_dismissalBoundsRect?.minX,
        options?.unstable_dismissalBoundsRect?.maxX,
        options?.unstable_dismissalBoundsRect?.minY,
        options?.unstable_dismissalBoundsRect?.maxY,
        context.setDismissalBoundsRect,
        gestureEnabled,
        navigation,
        isFocused,
        isPreloaded,
        isModal,
        isPreview,
    ]);
}
//# sourceMappingURL=usePreventZoomTransitionDismissal.ios.js.map