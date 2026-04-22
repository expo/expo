'use client';
import { createNavigatorFactory, DrawerRouter, useNavigationBuilder, } from '../../native';
import { DrawerView } from '../views/DrawerView';
function DrawerNavigator({ id, initialRouteName, defaultStatus = 'closed', backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(DrawerRouter, {
        id,
        initialRouteName,
        defaultStatus,
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
      <DrawerView {...rest} defaultStatus={defaultStatus} state={state} descriptors={descriptors} navigation={navigation}/>
    </NavigationContent>);
}
export function createDrawerNavigator(config) {
    return createNavigatorFactory(DrawerNavigator)(config);
}
//# sourceMappingURL=createDrawerNavigator.js.map