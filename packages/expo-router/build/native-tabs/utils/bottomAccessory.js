"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBottomAccessoryFunctionFromBottomAccessories = useBottomAccessoryFunctionFromBottomAccessories;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const hooks_1 = require("../hooks");
/**
 * Converts `<NativeTabs.BottomAccessory>` component into a function,
 * which can be used by `react-native-screens` to render the accessory.
 */
function useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory) {
    return (0, react_1.useMemo)(() => bottomAccessory
        ? (environment) => ((0, jsx_runtime_1.jsx)(hooks_1.BottomAccessoryPlacementContext, { value: environment, children: bottomAccessory.props.children }))
        : undefined, [bottomAccessory]);
}
//# sourceMappingURL=bottomAccessory.js.map