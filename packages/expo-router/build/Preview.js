'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preview = exports.PreviewParamsContext = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const router_store_1 = require("./global-state/router-store");
const useScreens_1 = require("./useScreens");
exports.PreviewParamsContext = (0, react_1.createContext)(undefined);
function Preview({ href, ...props }) {
    let state = router_store_1.store.getStateForHref(href);
    let routeNode = router_store_1.store.routeNode;
    const params = {};
    while (state && routeNode) {
        const route = state.routes[state.index || state.routes.length - 1];
        Object.assign(params, route.params);
        state = route.state;
        routeNode = routeNode.children.find((child) => child.route === route.name);
    }
    if (!routeNode) {
        return null;
    }
    const Component = (0, useScreens_1.getQualifiedRouteComponent)(routeNode);
    return (<exports.PreviewParamsContext.Provider value={params}>
      <react_native_1.Modal transparent {...props}>
        <react_native_1.Pressable style={styles.outer} onPress={props.onDismiss}>
          <react_native_1.View style={styles.inner}>
            <Component />
          </react_native_1.View>
        </react_native_1.Pressable>
      </react_native_1.Modal>
    </exports.PreviewParamsContext.Provider>);
}
exports.Preview = Preview;
const styles = react_native_1.StyleSheet.create({
    outer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        height: '100%',
    },
    inner: {
        backgroundColor: 'white',
        height: '50%',
        width: '50%',
        margin: 'auto',
        pointerEvents: 'none',
    },
});
//# sourceMappingURL=Preview.js.map