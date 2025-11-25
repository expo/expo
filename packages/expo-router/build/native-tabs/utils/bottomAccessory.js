"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBottomAccessoryFunctionFromBottomAccessories = useBottomAccessoryFunctionFromBottomAccessories;
const react_1 = require("react");
/**
 * Converts an array of `<NativeTabs.BottomAccessory>` components into a function,
 * which can be used by `react-native-screens` to render the accessory
 */
function useBottomAccessoryFunctionFromBottomAccessories(bottomAccessories) {
    const regularAccessory = (0, react_1.useMemo)(() => bottomAccessories.find((accessory) => accessory.props.forState === 'regular') ??
        bottomAccessories[0], [bottomAccessories]);
    const inlineAccessory = (0, react_1.useMemo)(() => bottomAccessories.find((accessory) => accessory.props.forState === 'inline') ??
        bottomAccessories[0], [bottomAccessories]);
    return (0, react_1.useMemo)(() => bottomAccessories.length > 0
        ? (environment) => {
            if (environment === 'inline') {
                return inlineAccessory.props.children;
            }
            return regularAccessory.props.children;
        }
        : undefined, [regularAccessory, inlineAccessory]);
}
//# sourceMappingURL=bottomAccessory.js.map