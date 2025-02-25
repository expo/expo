import { createNavigatorFactory, StackActions, StackRouter, useNavigationBuilder, } from '@react-navigation/native';
import { NativeStackView, } from '@react-navigation/native-stack';
import * as React from 'react';
function NativeStackNavigator({ id, initialRouteName, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_getStateForRouteNamesChange, ...rest }) {
    const { state, describe, descriptors, navigation, NavigationContent } = useNavigationBuilder(StackRouter, {
        id,
        initialRouteName,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_getStateForRouteNamesChange,
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
    return (<NavigationContent>
      <NativeStackView {...rest} state={state} navigation={navigation} descriptors={descriptors} describe={describe}/>
    </NavigationContent>);
}
export function createNativeStackNavigator(config) {
    return createNavigatorFactory(NativeStackNavigator)(config);
}
//# sourceMappingURL=createNativeStackNavigator.js.map