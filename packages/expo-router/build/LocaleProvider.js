"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocaleProvider = LocaleProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const LocaleDirContext_1 = require("./react-navigation/native/LocaleDirContext");
function LocaleProvider({ direction, children }) {
    return (0, jsx_runtime_1.jsx)(LocaleDirContext_1.LocaleDirContext.Provider, { value: direction, children: children });
}
//# sourceMappingURL=LocaleProvider.js.map