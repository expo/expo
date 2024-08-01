"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabs = void 0;
const react_native_1 = require("react-native");
const Tabs_common_1 = require("./Tabs.common");
const Tabs_hooks_1 = require("./Tabs.hooks");
__exportStar(require("./Tabs.common"), exports);
__exportStar(require("./Tabs.hooks"), exports);
__exportStar(require("./Tabs.list"), exports);
__exportStar(require("./Tabs.slot"), exports);
function Tabs({ children, options, ...props }) {
    const tabs = (0, Tabs_hooks_1.useTabsWithChildren)({ children, ...options });
    const NavigationContent = tabs.NavigationContent;
    return (<Tabs_common_1.TabsContext.Provider value={tabs}>
      <react_native_1.View style={styles.tabsRoot} {...props}>
        <NavigationContent>{children}</NavigationContent>
      </react_native_1.View>
    </Tabs_common_1.TabsContext.Provider>);
}
exports.Tabs = Tabs;
const styles = react_native_1.StyleSheet.create({
    tabsRoot: {
        flex: 1,
    },
});
//# sourceMappingURL=Tabs.js.map