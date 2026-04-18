'use client';
import { createNavigatorFactory, TabRouter, useNavigationBuilder, } from '../../native';
import { BottomTabView } from '../views/BottomTabView';
function BottomTabNavigator({ id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(TabRouter, {
        id,
        initialRouteName,
        backBehavior,
        UNSTABLE_routeNamesChangeBehavior,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_router,
    });
    return (<NavigationContent>
      <BottomTabView {...rest} state={state} navigation={navigation} descriptors={descriptors}/>
    </NavigationContent>);
}
export function createBottomTabNavigator(config) {
    return createNavigatorFactory(BottomTabNavigator)(config);
}
//# sourceMappingURL=createBottomTabNavigator.js.map