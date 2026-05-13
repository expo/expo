"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterToolbarHost = RouterToolbarHost;
exports.RouterToolbarItem = RouterToolbarItem;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_1 = require("expo");
const RouterToolbarHostView = (0, expo_1.requireNativeView)('ExpoRouterToolbarModule', 'RouterToolbarHostView');
function RouterToolbarHost(props) {
    return ((0, jsx_runtime_1.jsx)(RouterToolbarHostView, { ...props, style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
        } }));
}
const RouterToolbarItemView = (0, expo_1.requireNativeView)('ExpoRouterToolbarModule', 'RouterToolbarItemView');
function RouterToolbarItem(props) {
    // Needed to pass shared object ID to native side
    const imageObjectId = props.image?.__expo_shared_object_id__;
    return (0, jsx_runtime_1.jsx)(RouterToolbarItemView, { ...props, image: imageObjectId });
}
//# sourceMappingURL=native.ios.js.map