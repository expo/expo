"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBadgeContentDescription = getBadgeContentDescription;
exports.ToolbarItemBadge = ToolbarItemBadge;
// Toolbar badges are only rendered through Jetpack Compose on Android
// (see ToolbarItemBadge.android.tsx). On other platforms these are no-ops —
// iOS badge support flows through native header items instead.
function getBadgeContentDescription(_accessibilityLabel, _badge) {
    return undefined;
}
function ToolbarItemBadge(_props) {
    return null;
}
//# sourceMappingURL=ToolbarItemBadge.js.map