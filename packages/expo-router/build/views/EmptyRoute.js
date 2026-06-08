"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyRoute = EmptyRoute;
const jsx_runtime_1 = require("react/jsx-runtime");
const Toast_1 = require("./Toast");
const Route_1 = require("../Route");
function EmptyRoute() {
    const route = (0, Route_1.useRouteNode)();
    return ((0, jsx_runtime_1.jsx)(Toast_1.ToastWrapper, { children: (0, jsx_runtime_1.jsx)(Toast_1.Toast, { warning: true, filename: route?.contextKey, children: "Missing default export" }) }));
}
//# sourceMappingURL=EmptyRoute.js.map