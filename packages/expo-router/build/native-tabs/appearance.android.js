"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndroidScreenAppearance = createAndroidScreenAppearance;
const color_1 = require("../color");
function createAndroidScreenAppearance({ options, tintColor, rippleColor, disableIndicator, labelVisibilityMode, }) {
    const labelStyle = options.labelStyle;
    const selectedLabelStyle = options.selectedLabelStyle;
    const normal = {
        tabBarItemTitleFontColor: labelStyle?.color ?? color_1.Color.android.dynamic.onSurfaceVariant,
        tabBarItemIconColor: options.iconColor ?? color_1.Color.android.dynamic.onSurfaceVariant,
    };
    const selected = {
        tabBarItemTitleFontColor: selectedLabelStyle?.color ??
            labelStyle?.color ??
            tintColor ??
            color_1.Color.android.dynamic.onSurface,
        tabBarItemIconColor: options.selectedIconColor ??
            options.iconColor ??
            tintColor ??
            color_1.Color.android.dynamic.onSecondaryContainer,
    };
    return {
        tabBarBackgroundColor: options.backgroundColor ?? color_1.Color.android.dynamic.surfaceContainer,
        tabBarItemRippleColor: rippleColor ?? color_1.Color.android.dynamic.primary,
        tabBarItemLabelVisibilityMode: labelVisibilityMode,
        tabBarItemActiveIndicatorColor: options.indicatorColor ?? color_1.Color.android.dynamic.secondaryContainer,
        tabBarItemActiveIndicatorEnabled: !disableIndicator,
        tabBarItemTitleFontFamily: labelStyle?.fontFamily,
        tabBarItemTitleSmallLabelFontSize: labelStyle?.fontSize,
        tabBarItemTitleLargeLabelFontSize: selectedLabelStyle?.fontSize ?? labelStyle?.fontSize,
        tabBarItemTitleFontWeight: labelStyle?.fontWeight,
        tabBarItemTitleFontStyle: labelStyle?.fontStyle,
        tabBarItemBadgeBackgroundColor: options.badgeBackgroundColor,
        tabBarItemBadgeTextColor: options.badgeTextColor,
        normal,
        selected,
    };
}
//# sourceMappingURL=appearance.android.js.map