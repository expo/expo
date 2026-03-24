"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDrawerNavigator = createDrawerNavigator;
const native_1 = require("../../native");
const DrawerView_1 = require("../views/DrawerView");
function DrawerNavigator({ id, initialRouteName, defaultStatus = 'closed', backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.DrawerRouter, {
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
      <DrawerView_1.DrawerView {...rest} defaultStatus={defaultStatus} state={state} descriptors={descriptors} navigation={navigation}/>
    </NavigationContent>);
}
function createDrawerNavigator(config) {
    return (0, native_1.createNavigatorFactory)(DrawerNavigator)(config);
}
//# sourceMappingURL=createDrawerNavigator.js.map