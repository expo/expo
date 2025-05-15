"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RNSNativeTabsScreen = RNSNativeTabsScreen;
const react_1 = require("react");
const react_native_1 = require("react-native");
function RNSNativeTabsScreen(props) {
    (0, react_1.useEffect)(() => {
        props.onAppear?.();
        return () => {
            props.onDisappear?.();
        };
    }, []);
    return <react_native_1.View style={{ flex: 1 }}>{props.children}</react_native_1.View>;
}
//# sourceMappingURL=RNSNativeTabsScreen.js.map