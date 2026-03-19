"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processHeaderItemsForPlatform = processHeaderItemsForPlatform;
/**
 * Default/web noop. On iOS, the `.ios.tsx` variant converts children to
 * `unstable_headerLeftItems`/`unstable_headerRightItems`. On Android, the
 * `.android.tsx` variant renders native Compose components via `headerLeft`/`headerRight`.
 */
function processHeaderItemsForPlatform(_children, _placement, _colors) {
    return null;
}
//# sourceMappingURL=processHeaderItemsForPlatform.js.map