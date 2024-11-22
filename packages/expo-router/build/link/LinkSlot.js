"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Slot = void 0;
const react_slot_1 = require("@radix-ui/react-slot");
const react_1 = require("react");
const react_native_1 = require("react-native");
/**
 * RadixUI has special logic to handle the merging of `style` and `className` props.
 * On the web styles are not allowed so Radix does not handle this scenario.
 * This could be fixed upstream (PR open), but it may not as RN is not their target
 * platform.
 *
 * This shim calls `StyleSheet.flatten` on the styles before we render the <Slot />
 *
 * @see https://github.com/expo/expo/issues/31352
 * @see https://github.com/radix-ui/primitives/issues/3107
 * @param Component
 * @returns
 */
function ShimSlotForReactNative(Component) {
    return (0, react_1.forwardRef)(function RNSlotHOC({ style, ...props }, ref) {
        style = (0, react_1.useMemo)(() => react_native_1.StyleSheet.flatten(style), [style]);
        return <Component ref={ref} {...props} style={style}/>;
    });
}
exports.Slot = ShimSlotForReactNative(react_slot_1.Slot);
//# sourceMappingURL=LinkSlot.js.map