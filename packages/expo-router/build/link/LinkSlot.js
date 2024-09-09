"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Slot = void 0;
const react_slot_1 = require("@radix-ui/react-slot");
const react_1 = require("react");
const react_native_1 = require("react-native");
function ShimSlotForReactNative(Component) {
    return (0, react_1.forwardRef)(function RNSlotHOC({ style, ...props }, ref) {
        style = (0, react_1.useMemo)(() => react_native_1.StyleSheet.flatten(style), [style]);
        return <Component ref={ref} {...props} style={style}/>;
    });
}
exports.Slot = ShimSlotForReactNative(react_slot_1.Slot);
//# sourceMappingURL=LinkSlot.js.map