"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTabsContext = exports.TabsContext = void 0;
const react_1 = require("react");
exports.TabsContext = (0, react_1.createContext)(null);
function useTabsContext() {
    const tabsContext = (0, react_1.useContext)(exports.TabsContext);
    if (!tabsContext) {
        throw new Error('useBuilderContext used');
    }
    return tabsContext;
}
exports.useTabsContext = useTabsContext;
//# sourceMappingURL=Tabs.common.js.map