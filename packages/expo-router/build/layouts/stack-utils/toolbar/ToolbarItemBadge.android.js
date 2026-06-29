"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBadgeContentDescription = getBadgeContentDescription;
exports.ToolbarItemBadge = ToolbarItemBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const font_1 = require("../../../utils/font");
/** A badge shows text when its value is neither null nor empty; otherwise it's a bare dot. */
function badgeHasValue(badge) {
    return badge?.value != null && badge.value !== '';
}
/**
 * Builds the spoken description for a badged icon so TalkBack announces the
 * badge value (e.g. an unread count) alongside the label.
 */
function getBadgeContentDescription(accessibilityLabel, badge) {
    if (!accessibilityLabel) {
        return undefined;
    }
    return badgeHasValue(badge) ? `${accessibilityLabel}, ${badge.value}` : accessibilityLabel;
}
/**
 * Overlays a Material 3 Badge on the top-end corner of a toolbar item's icon.
 * Compose anchors a badge to a single child, so the icon is wrapped in a Box.
 * Renders the anchor unchanged when there's no badge, and a dot (no text) when
 * the badge has no value. Shared by Stack.Toolbar.Button and Stack.Toolbar.Menu.
 */
function ToolbarItemBadge({ badge, disabled, children, }) {
    if (!badge) {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
    }
    return ((0, jsx_runtime_1.jsxs)(jetpack_compose_1.Box, { contentAlignment: "topEnd", children: [children, (0, jsx_runtime_1.jsx)(jetpack_compose_1.Badge, { containerColor: badge.style?.backgroundColor, contentColor: badge.style?.color, modifiers: disabled ? [(0, modifiers_1.alpha)(0.38)] : undefined, children: badgeHasValue(badge) ? ((0, jsx_runtime_1.jsx)(jetpack_compose_1.Text, { style: {
                        typography: 'labelSmall',
                        fontWeight: (0, font_1.convertFontWeightToComposeFontWeight)(badge.style?.fontWeight),
                        fontSize: badge.style?.fontSize,
                        fontFamily: badge.style?.fontFamily,
                    }, children: String(badge.value) })) : null })] }));
}
//# sourceMappingURL=ToolbarItemBadge.android.js.map