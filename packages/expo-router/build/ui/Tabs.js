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
const react_1 = require("react");
const react_native_1 = require("react-native");
const Tab_hooks_1 = require("./Tab-hooks");
const common_1 = require("./common");
__exportStar(require("./Tab-shared"), exports);
__exportStar(require("./Tab-hooks"), exports);
__exportStar(require("./TabList"), exports);
__exportStar(require("./TabSlot"), exports);
function Tabs({ children, asChild, options, ...props }) {
    const Comp = asChild ? common_1.ViewSlot : react_native_1.View;
    const { NavigationContent } = (0, Tab_hooks_1.useTabsWithChildren)({
        // asChild adds an extra layer, so we need to process the child's children
        children: asChild && (0, react_1.isValidElement)(children) ? children.props.children : children,
        ...options,
    });
    return (<Comp style={styles.tabsRoot} {...props}>
      <NavigationContent>{children}</NavigationContent>
    </Comp>);
}
exports.Tabs = Tabs;
const styles = react_native_1.StyleSheet.create({
    tabsRoot: {
        flex: 1,
    },
});
//# sourceMappingURL=Tabs.js.map