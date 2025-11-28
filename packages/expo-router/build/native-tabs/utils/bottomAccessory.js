"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBottomAccessoryFunctionFromBottomAccessories = useBottomAccessoryFunctionFromBottomAccessories;
const react_1 = require("react");
const hooks_1 = require("../hooks");
/**
 * Converts `<NativeTabs.BottomAccessory>` component into a function,
 * which can be used by `react-native-screens` to render the accessory.
 */
function useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory) {
    return (0, react_1.useMemo)(() => bottomAccessory
        ? (environment) => (<hooks_1.BottomAccessoryEnvironmentContext value={environment}>
              {bottomAccessory.props.children}
            </hooks_1.BottomAccessoryEnvironmentContext>)
        : undefined, [bottomAccessory]);
}
//# sourceMappingURL=bottomAccessory.js.map