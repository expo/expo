"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspenseFallback = SuspenseFallback;
const jsx_runtime_1 = require("react/jsx-runtime");
const Toast_1 = require("./Toast");
function SuspenseFallback({ route }) {
    if (__DEV__) {
        return ((0, jsx_runtime_1.jsx)(Toast_1.ToastWrapper, { children: (0, jsx_runtime_1.jsx)(Toast_1.Toast, { filename: route, children: "Bundling..." }) }));
    }
    return null;
}
//# sourceMappingURL=SuspenseFallback.js.map