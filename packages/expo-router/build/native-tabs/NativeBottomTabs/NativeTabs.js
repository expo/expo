"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabs = void 0;
const NativeBottomTabsNavigator_1 = require("./NativeBottomTabsNavigator");
const TabOptions_1 = require("./TabOptions");
exports.NativeTabs = Object.assign((props) => {
    return <NativeBottomTabsNavigator_1.NativeTabsNavigatorWithContext {...props}/>;
}, { Trigger: TabOptions_1.TabTrigger });
//# sourceMappingURL=NativeTabs.js.map