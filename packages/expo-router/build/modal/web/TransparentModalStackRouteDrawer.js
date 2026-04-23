"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparentModalStackRouteDrawer = TransparentModalStackRouteDrawer;
const jsx_runtime_1 = require("react/jsx-runtime");
const vaul_1 = require("vaul");
const modalStyles_1 = __importDefault(require("./modalStyles"));
function TransparentModalStackRouteDrawer({ routeKey, options, dismissible, renderScreen, onDismiss, }) {
    const handleOpenChange = (open) => {
        if (!open)
            onDismiss();
    };
    return ((0, jsx_runtime_1.jsx)(vaul_1.Drawer.Root, { defaultOpen: true, autoFocus: true, dismissible: dismissible ?? options.gestureEnabled ?? false, onAnimationEnd: handleOpenChange, children: (0, jsx_runtime_1.jsx)(vaul_1.Drawer.Portal, { children: (0, jsx_runtime_1.jsxs)(vaul_1.Drawer.Content, { className: modalStyles_1.default.transparentDrawerContent, children: [(0, jsx_runtime_1.jsx)(vaul_1.Drawer.Title, { about: "", "aria-describedby": "", className: modalStyles_1.default.srOnly }), (0, jsx_runtime_1.jsx)(vaul_1.Drawer.Description, { about: "", className: modalStyles_1.default.srOnly }), (0, jsx_runtime_1.jsx)("div", { className: modalStyles_1.default.modalBody, children: renderScreen() })] }) }) }, `${routeKey}-transparent`));
}
//# sourceMappingURL=TransparentModalStackRouteDrawer.js.map