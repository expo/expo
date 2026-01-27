"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuAction = MenuAction;
exports.Menu = Menu;
const react_1 = require("react");
const InternalLinkPreviewContext_1 = require("../link/InternalLinkPreviewContext");
/**
 * This component renders a context menu action for a link.
 * It should only be used as a child of `Link.Menu` or `LinkMenu`.
 *
 * @platform ios
 */
function MenuAction(props) {
    if ((0, react_1.use)(InternalLinkPreviewContext_1.InternalLinkPreviewContext)) {
        console.warn('<MenuAction> is currently not supported inside Link. Use Link.MenuAction instead.');
    }
    return null;
}
function Menu(props) {
    if ((0, react_1.use)(InternalLinkPreviewContext_1.InternalLinkPreviewContext)) {
        console.warn('Menu is currently not supported inside Link. Use Link.Menu instead.');
    }
    return null;
}
//# sourceMappingURL=menu.js.map