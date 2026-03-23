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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerContentScrollView = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const native_1 = require("../../native");
const DrawerPositionContext_1 = require("../utils/DrawerPositionContext");
const SPACING = 12;
function DrawerContentScrollViewInner({ contentContainerStyle, style, children, ...rest }, ref) {
    const drawerPosition = React.useContext(DrawerPositionContext_1.DrawerPositionContext);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { direction } = (0, native_1.useLocale)();
    const isRight = direction === 'rtl' ? drawerPosition === 'left' : drawerPosition === 'right';
    return (<react_native_1.ScrollView {...rest} ref={ref} contentContainerStyle={[
            {
                paddingTop: SPACING + insets.top,
                paddingBottom: SPACING + insets.bottom,
                paddingStart: SPACING + (!isRight ? insets.left : 0),
                paddingEnd: SPACING + (isRight ? insets.right : 0),
            },
            contentContainerStyle,
        ]} style={[styles.container, style]}>
      {children}
    </react_native_1.ScrollView>);
}
exports.DrawerContentScrollView = React.forwardRef(DrawerContentScrollViewInner);
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
});
//# sourceMappingURL=DrawerContentScrollView.js.map