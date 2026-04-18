import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as React from 'react';
import { CompositionContext, mergeOptions, useCompositionRegistry } from './composition-options';
import { DescriptorsContext } from './descriptors-context';
import { usePreviewTransition } from './usePreviewTransition';
import { INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME, } from '../../navigationParams';
import { createNavigatorFactory, StackActions, StackRouter, useNavigationBuilder, } from '../../react-navigation/native';
import { NativeStackView, } from '../../react-navigation/native-stack';
const GLASS = isLiquidGlassAvailable();
function NativeStackNavigator({ id, initialRouteName, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, describe, descriptors, navigation, NavigationContent } = useNavigationBuilder(StackRouter, {
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
                        ...StackActions.popToTop(),
                        target: state.key,
                    });
                }
                // END FORK
            }
        });
    }), [navigation, state.index, state.key]);
    // START FORK
    const { computedState, computedDescriptors, navigationWrapper } = usePreviewTransition(state, navigation, descriptors, describe);
    // Map internal gesture option to React Navigation's gestureEnabled option
    // This allows Expo Router to override gesture behavior without affecting user settings
    const finalDescriptors = React.useMemo(() => {
        let needsNewMap = false;
        const result = {};
        for (const key of Object.keys(computedDescriptors)) {
            const descriptor = computedDescriptors[key];
            const options = descriptor.options;
            const internalGestureEnabled = options?.[INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME];
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
    const { registry, contextValue } = useCompositionRegistry();
    const mergedDescriptors = React.useMemo(() => mergeOptions(finalDescriptors, registry, computedState), [finalDescriptors, computedState, registry]);
    // END FORK
    return (
    // START FORK
    <DescriptorsContext value={descriptors}>
      {/* END FORK */}
      <NavigationContent>
        <CompositionContext value={contextValue}>
          <NativeStackView {...rest} 
    // START FORK
    state={computedState} navigation={navigationWrapper} descriptors={mergedDescriptors} 
    // state={state}
    // navigation={navigation}
    // descriptors={descriptors}
    // END FORK
    describe={describe}/>
        </CompositionContext>
      </NavigationContent>
      {/* START FORK */}
    </DescriptorsContext>
    // END FORK
    );
}
export function createNativeStackNavigator(config) {
    return createNavigatorFactory(NativeStackNavigator)(config);
}
//# sourceMappingURL=createNativeStackNavigator.js.map