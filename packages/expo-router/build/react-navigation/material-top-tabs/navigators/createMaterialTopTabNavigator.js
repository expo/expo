import { createNavigatorFactory, TabRouter, useNavigationBuilder, } from '../../native';
import { MaterialTopTabView } from '../views/MaterialTopTabView';
function MaterialTopTabNavigator({ id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
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
      <MaterialTopTabView {...rest} state={state} navigation={navigation} descriptors={descriptors}/>
    </NavigationContent>);
}
export function createMaterialTopTabNavigator(config) {
    return createNavigatorFactory(MaterialTopTabNavigator)(config);
}
//# sourceMappingURL=createMaterialTopTabNavigator.js.map