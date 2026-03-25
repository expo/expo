"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabBarIcon = TabBarIcon;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const elements_1 = require("../../elements");
/**
 * Icon sizes taken from Apple HIG
 * https://developer.apple.com/design/human-interface-guidelines/tab-bars
 */
const ICON_SIZE_WIDE = 31;
const ICON_SIZE_WIDE_COMPACT = 23;
const ICON_SIZE_TALL = 28;
const ICON_SIZE_TALL_COMPACT = 20;
const ICON_SIZE_ROUND = 25;
const ICON_SIZE_ROUND_COMPACT = 18;
const ICON_SIZE_MATERIAL = 24;
function TabBarIcon({ route: _, variant, size, badge, badgeStyle, activeOpacity, inactiveOpacity, activeTintColor, inactiveTintColor, renderIcon, allowFontScaling, style, }) {
    const iconSize = variant === 'material'
        ? ICON_SIZE_MATERIAL
        : size === 'compact'
            ? ICON_SIZE_ROUND_COMPACT
            : ICON_SIZE_ROUND;
    // We render the icon twice at the same position on top of each other:
    // active and inactive one, so we can fade between them.
    return (<react_native_1.View style={[
            variant === 'material'
                ? styles.wrapperMaterial
                : size === 'compact'
                    ? styles.wrapperUikitCompact
                    : styles.wrapperUikit,
            style,
        ]}>
      <react_native_1.View style={[
            styles.icon,
            {
                opacity: activeOpacity,
                // Workaround for react-native >= 0.54 layout bug
                minWidth: iconSize,
            },
        ]}>
        {renderIcon({
            focused: true,
            size: iconSize,
            color: activeTintColor,
        })}
      </react_native_1.View>
      <react_native_1.View style={[styles.icon, { opacity: inactiveOpacity }]}>
        {renderIcon({
            focused: false,
            size: iconSize,
            color: inactiveTintColor,
        })}
      </react_native_1.View>
      <elements_1.Badge visible={badge != null} size={iconSize * 0.75} allowFontScaling={allowFontScaling} style={[styles.badge, badgeStyle]}>
        {badge}
      </elements_1.Badge>
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    icon: {
        // We render the icon twice at the same position on top of each other:
        // active and inactive one, so we can fade between them:
        // Cover the whole iconContainer:
        position: 'absolute',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    },
    wrapperUikit: {
        width: ICON_SIZE_WIDE,
        height: ICON_SIZE_TALL,
    },
    wrapperUikitCompact: {
        width: ICON_SIZE_WIDE_COMPACT,
        height: ICON_SIZE_TALL_COMPACT,
    },
    wrapperMaterial: {
        width: ICON_SIZE_MATERIAL,
        height: ICON_SIZE_MATERIAL,
    },
    badge: {
        position: 'absolute',
        end: -3,
        top: -3,
    },
});
//# sourceMappingURL=TabBarIcon.js.map