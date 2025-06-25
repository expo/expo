"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottomAccessory = BottomAccessory;
const react_1 = require("react");
const NativeTabsViewContext_1 = require("./NativeTabsViewContext");
const TabInfoContext_1 = require("./TabInfoContext");
function BottomAccessory(props) {
    const tabInfo = (0, react_1.use)(TabInfoContext_1.TabInfoContext);
    const { setBottomTabAccessory } = (0, NativeTabsViewContext_1.useBottomTabAccessory)();
    (0, react_1.useEffect)(() => {
        if (tabInfo) {
            setBottomTabAccessory(tabInfo.tabKey, props);
        }
    }, []);
    return null;
}
//# sourceMappingURL=BottomAccessory.js.map