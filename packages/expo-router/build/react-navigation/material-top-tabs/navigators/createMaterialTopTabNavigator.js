"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialTopTabNavigator = createMaterialTopTabNavigator;
const native_1 = require("../../native");
const MaterialTopTabView_1 = require("../views/MaterialTopTabView");
function MaterialTopTabNavigator({ id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.TabRouter, {
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
      <MaterialTopTabView_1.MaterialTopTabView {...rest} state={state} navigation={navigation} descriptors={descriptors}/>
    </NavigationContent>);
}
function createMaterialTopTabNavigator(config) {
    return (0, native_1.createNavigatorFactory)(MaterialTopTabNavigator)(config);
}
//# sourceMappingURL=createMaterialTopTabNavigator.js.map