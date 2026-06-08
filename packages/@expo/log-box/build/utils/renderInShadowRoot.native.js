"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderInShadowRoot = renderInShadowRoot;
/**
 * Native no-op for renderInShadowRoot.
 *
 * The real implementation lives in renderInShadowRoot.ts (used on web) and
 * depends on react-dom/client. This .native.ts variant ensures Metro never
 * tries to resolve react-dom on iOS/Android.
 */
function renderInShadowRoot(_id, _element) {
    throw new Error('renderInShadowRoot is not supported on native platforms.');
}
//# sourceMappingURL=renderInShadowRoot.native.js.map