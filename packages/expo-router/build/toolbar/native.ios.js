"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterToolbarHost = RouterToolbarHost;
exports.RouterToolbarItem = RouterToolbarItem;
const expo_1 = require("expo");
const RouterToolbarHostView = (0, expo_1.requireNativeView)('ExpoRouterToolbarModule', 'RouterToolbarHostView');
function RouterToolbarHost(props) {
    return (<RouterToolbarHostView {...props} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
        }}/>);
}
const RouterToolbarItemView = (0, expo_1.requireNativeView)('ExpoRouterToolbarModule', 'RouterToolbarItemView');
function RouterToolbarItem(props) {
    return <RouterToolbarItemView {...props}/>;
}
//# sourceMappingURL=native.ios.js.map