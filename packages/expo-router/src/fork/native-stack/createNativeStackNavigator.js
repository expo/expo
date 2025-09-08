import { createNavigatorFactory, StackActions, StackRouter, useNavigationBuilder, } from '@react-navigation/native';
import { NativeStackView, } from '@react-navigation/native-stack';
import * as React from 'react';
import { useLinkPreviewContext } from '../../link/preview/LinkPreviewContext';
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
                navigation.dispatch({
                    ...StackActions.popToTop(),
                    target: state.key,
                });
            }
        });
    }), [navigation, state.index, state.key]);
    // START FORK
    const { openPreviewKey, setOpenPreviewKey } = useLinkPreviewContext();
    // This is used to track the preview screen that is currently transitioning on the native side
    const [previewTransitioningScreenId, setPreviewTransitioningScreenId] = React.useState();
    React.useEffect(() => {
        if (previewTransitioningScreenId) {
            // This means that the state was updated after the preview transition
            if (state.routes.some((route) => route.key === previewTransitioningScreenId)) {
                // We no longer need to track the preview transitioning screen
                setPreviewTransitioningScreenId(undefined);
            }
        }
    }, [state, previewTransitioningScreenId]);
    const navigationWrapper = React.useMemo(() => {
        if (openPreviewKey) {
            const emit = (...args) => {
                const { target, type, data } = args[0];
                if (target === openPreviewKey && data && 'closing' in data && !data.closing) {
                    // onWillAppear
                    if (type === 'transitionStart') {
                        // The screen from preview will appear, so we need to start tracking it
                        setPreviewTransitioningScreenId(openPreviewKey);
                    }
                    // onAppear
                    else if (type === 'transitionEnd') {
                        // The screen from preview appeared.
                        // We can now restore the stack animation
                        setOpenPreviewKey(undefined);
                    }
                }
                return navigation.emit(...args);
            };
            return {
                ...navigation,
                emit,
            };
        }
        return navigation;
    }, [navigation, openPreviewKey, setOpenPreviewKey]);
    const { computedState, computedDescriptors } = React.useMemo(() => {
        // The preview screen was pushed on the native side, but react-navigation state was not updated yet
        if (previewTransitioningScreenId) {
            const preloadedRoute = state.preloadedRoutes.find((route) => route.key === previewTransitioningScreenId);
            if (preloadedRoute) {
                const newState = {
                    ...state,
                    // On native side the screen is already pushed, so we need to update the state
                    preloadedRoutes: state.preloadedRoutes.filter((route) => route.key !== previewTransitioningScreenId),
                    routes: [...state.routes, preloadedRoute],
                    index: state.index + 1,
                };
                const newDescriptors = previewTransitioningScreenId in descriptors
                    ? descriptors
                    : {
                        ...descriptors,
                        // We need to add the descriptor. For react-navigation this is still preloaded screen
                        // Replicating the logic from https://github.com/react-navigation/react-navigation/blob/eaf1100ac7d99cb93ba11a999549dd0752809a78/packages/native-stack/src/views/NativeStackView.native.tsx#L489
                        [previewTransitioningScreenId]: describe(preloadedRoute, true),
                    };
                return {
                    computedState: newState,
                    computedDescriptors: newDescriptors,
                };
            }
        }
        return {
            computedState: state,
            computedDescriptors: descriptors,
        };
    }, [state, previewTransitioningScreenId, describe, descriptors]);
    // END FORK
    return (<NavigationContent>
      <NativeStackView {...rest} 
    // START FORK
    state={computedState} navigation={navigationWrapper} descriptors={computedDescriptors} 
    // state={state}
    // navigation={navigation}
    // descriptors={descriptors}
    // END FORK
    describe={describe}/>
    </NavigationContent>);
}
export function createNativeStackNavigator(config) {
    return createNavigatorFactory(NativeStackNavigator)(config);
}
//# sourceMappingURL=createNativeStackNavigator.js.map