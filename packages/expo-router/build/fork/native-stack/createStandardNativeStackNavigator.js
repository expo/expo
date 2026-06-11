"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStandardNativeStackNavigator = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_glass_effect_1 = require("expo-glass-effect");
const React = __importStar(require("react"));
const standard_navigation_1 = require("standard-navigation");
const composition_options_1 = require("./composition-options");
const descriptors_context_1 = require("./descriptors-context");
const usePreviewTransition_1 = require("./usePreviewTransition");
const navigationParams_1 = require("../../navigationParams");
const native_stack_1 = require("../../react-navigation/native-stack");
const GLASS = (0, expo_glass_effect_1.isLiquidGlassAvailable)();
function NativeStackContent({ state, descriptors, emitter, pop, subscribeTabPressPopToTop, }) {
    // The standard contract narrows descriptors to `{ options, render }`, but the integration layer
    // forwards the real react-navigation descriptors at runtime (including the ones it describes for
    // the preloaded routes), so headers/screens can read `.navigation`/`.route`.
    const rnDescriptors = descriptors;
    // When user taps on already focused tab and we're inside the tab, reset the stack to replicate
    // native behaviour. The subscription is built in `createProps`, where the parent navigation and
    // raw state are available.
    React.useEffect(() => subscribeTabPressPopToTop?.(), [subscribeTabPressPopToTop]);
    // `usePreviewTransition` wraps `emit` to track the native preview transition; the SAME wrapped
    // emit must flow into the view so transition events reach the wrapper.
    const emitterNavigation = React.useMemo(() => ({ emit: emitter.emit }), [emitter]);
    const { computedState, computedDescriptors, navigationWrapper } = (0, usePreviewTransition_1.usePreviewTransition)(state, emitterNavigation, rnDescriptors);
    // Map internal gesture option to React Navigation's gestureEnabled option
    // This allows Expo Router to override gesture behavior without affecting user settings
    const finalDescriptors = React.useMemo(() => {
        let needsNewMap = false;
        const result = {};
        for (const key of Object.keys(computedDescriptors)) {
            const descriptor = computedDescriptors[key];
            const options = descriptor.options;
            const internalGestureEnabled = options?.[navigationParams_1.INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME];
            const needsGestureFix = internalGestureEnabled !== undefined;
            const needsGlassFix = GLASS && options?.presentation === 'formSheet';
            if (needsGestureFix || needsGlassFix) {
                needsNewMap = true;
                const newOptions = { ...options };
                if (needsGestureFix) {
                    newOptions.gestureEnabled = internalGestureEnabled;
                }
                if (needsGlassFix) {
                    newOptions.headerTransparent ??= true;
                    newOptions.contentStyle ??= { backgroundColor: 'transparent' };
                    newOptions.headerShadowVisible ??= false;
                    newOptions.headerLargeTitleShadowVisible ??= false;
                }
                result[key] = { ...descriptor, options: newOptions };
            }
            else {
                result[key] = descriptor;
            }
        }
        return needsNewMap ? result : computedDescriptors;
    }, [computedDescriptors]);
    const { registry, contextValue } = (0, composition_options_1.useCompositionRegistry)();
    const mergedDescriptors = React.useMemo(() => (0, composition_options_1.mergeOptions)(finalDescriptors, registry, computedState), [finalDescriptors, computedState, registry]);
    // `pop` and `subscribeTabPressPopToTop` are always supplied by `StackClient`'s `createProps`;
    // they are optional on the public component only so the user is not forced to pass them. The
    // `pop!` assertion below reflects that runtime guarantee.
    return ((0, jsx_runtime_1.jsx)(descriptors_context_1.DescriptorsContext, { value: rnDescriptors, children: (0, jsx_runtime_1.jsx)(composition_options_1.CompositionContext, { value: contextValue, children: (0, jsx_runtime_1.jsx)(native_stack_1.NativeStackView, { state: computedState, descriptors: mergedDescriptors, emit: navigationWrapper.emit, pop: pop }) }) }));
}
exports.createStandardNativeStackNavigator = (0, standard_navigation_1.createStandardNavigator)(NativeStackContent);
//# sourceMappingURL=createStandardNativeStackNavigator.js.map