'use client';
import React, { useCallback, useEffect } from 'react';
import { ModalStackRouteDrawer } from './ModalStackRouteDrawer';
import { TransparentModalStackRouteDrawer } from './TransparentModalStackRouteDrawer';
import { convertStackStateToNonModalState, findLastNonModalIndex, isTransparentModalPresentation, } from './utils';
import { withLayoutContext } from '../../layouts/withLayoutContext';
import { createNavigatorFactory, StackActions, StackRouter, useNavigationBuilder, usePreventRemoveContext, useTheme, } from '../../react-navigation/native';
import { NativeStackView, } from '../../react-navigation/native-stack';
function ModalStackNavigator({ initialRouteName, children, screenOptions, }) {
    const { state, navigation, descriptors, NavigationContent, describe } = useNavigationBuilder(StackRouter, {
        children,
        screenOptions,
        initialRouteName,
    });
    useEffect(() => 
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
      <ModalStackView state={state} navigation={navigation} descriptors={descriptors} describe={describe}/>
    </NavigationContent>);
}
const ModalStackView = ({ state, navigation, descriptors, describe }) => {
    const isWeb = process.env.EXPO_OS === 'web';
    const { colors } = useTheme();
    const { preventedRoutes } = usePreventRemoveContext();
    const { routes: filteredRoutes, index: nonModalIndex } = convertStackStateToNonModalState(state, descriptors, isWeb);
    const newStackState = {
        ...state,
        routes: filteredRoutes,
        index: nonModalIndex,
    };
    const dismiss = useCallback(() => {
        navigation.goBack();
    }, [navigation]);
    const overlayRoutes = React.useMemo(() => {
        if (!isWeb)
            return [];
        const idx = findLastNonModalIndex(state, descriptors);
        return state.routes.slice(idx + 1);
    }, [isWeb, state, descriptors]);
    return (<div style={{ flex: 1, display: 'flex' }}>
      <NativeStackView state={newStackState} navigation={navigation} descriptors={descriptors} describe={describe}/>
      {isWeb &&
            overlayRoutes.map((route) => {
                const isTransparentModal = isTransparentModalPresentation(descriptors[route.key].options);
                const isRemovePrevented = preventedRoutes[route.key]?.preventRemove;
                const ModalComponent = isTransparentModal
                    ? TransparentModalStackRouteDrawer
                    : ModalStackRouteDrawer;
                return (<ModalComponent key={route.key} routeKey={route.key} options={descriptors[route.key].options} renderScreen={descriptors[route.key].render} onDismiss={dismiss} dismissible={isRemovePrevented ? false : undefined} themeColors={colors}/>);
            })}
    </div>);
};
const createModalStack = createNavigatorFactory(ModalStackNavigator);
const RouterModal = withLayoutContext(createModalStack().Navigator);
const RouterModalScreen = RouterModal.Screen;
export { RouterModal, RouterModalScreen };
//# sourceMappingURL=ModalStack.js.map