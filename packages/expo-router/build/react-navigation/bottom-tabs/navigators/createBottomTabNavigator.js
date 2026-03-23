"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBottomTabNavigator = createBottomTabNavigator;
const native_1 = require("../../native");
const BottomTabView_1 = require("../views/BottomTabView");
function BottomTabNavigator({ id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
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
      <BottomTabView_1.BottomTabView {...rest} state={state} navigation={navigation} descriptors={descriptors}/>
    </NavigationContent>);
}
function createBottomTabNavigator(config) {
    return (0, native_1.createNavigatorFactory)(BottomTabNavigator)(config);
}
//# sourceMappingURL=createBottomTabNavigator.js.map