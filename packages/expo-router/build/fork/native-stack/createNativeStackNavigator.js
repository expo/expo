"use strict";
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
exports.createNativeStackNavigator = createNativeStackNavigator;
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const expo_glass_effect_1 = require("expo-glass-effect");
const React = __importStar(require("react"));
const composition_options_1 = require("./composition-options");
const descriptors_context_1 = require("./descriptors-context");
const usePreviewTransition_1 = require("./usePreviewTransition");
const navigationParams_1 = require("../../navigationParams");
const GLASS = (0, expo_glass_effect_1.isLiquidGlassAvailable)();
function NativeStackNavigator({ id, initialRouteName, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, describe, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.StackRouter, {
        id,
        initialRouteName,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_router,
    });
    React.useEffect(() => 
    // @ts-expect-error: there may not be a tab navigator in parent
    navigation?.addListener?.('tabPress', (e) => {
        const isFocused = navigation.isFocused();
        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
            if (state.index > 0 && isFocused && !e.defaultPrevented) {
                // When user taps on already focused tab and we're inside the tab,
                // reset the stack to replicate native behaviour
                // START FORK
                // navigation.dispatch({
                //   ...StackActions.popToTop(),
                //   target: state.key,
                // });
                // The popToTop will be automatically triggered on native side for native tabs
                if (e.data?.__internalTabsType !== 'native') {
                    navigation.dispatch({
                        ...native_1.StackActions.popToTop(),
                        target: state.key,
                    });
                }
                // END FORK
            }
        });
    }), [navigation, state.index, state.key]);
    // START FORK
    const { computedState, computedDescriptors, navigationWrapper } = (0, usePreviewTransition_1.usePreviewTransition)(state, navigation, descriptors, describe);
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
    // END FORK
    return (
    // START FORK
    <descriptors_context_1.DescriptorsContext value={descriptors}>
      {/* END FORK */}
      <NavigationContent>
        <composition_options_1.CompositionContext value={contextValue}>
          <native_stack_1.NativeStackView {...rest} 
    // START FORK
    state={computedState} navigation={navigationWrapper} descriptors={mergedDescriptors} 
    // state={state}
    // navigation={navigation}
    // descriptors={descriptors}
    // END FORK
    describe={describe}/>
        </composition_options_1.CompositionContext>
      </NavigationContent>
      {/* START FORK */}
    </descriptors_context_1.DescriptorsContext>
    // END FORK
    );
}
function createNativeStackNavigator(config) {
    return (0, native_1.createNavigatorFactory)(NativeStackNavigator)(config);
}
//# sourceMappingURL=createNativeStackNavigator.js.map