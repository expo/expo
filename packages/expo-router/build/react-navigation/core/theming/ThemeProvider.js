"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = ThemeProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeContext_1 = require("./ThemeContext");
function ThemeProvider({ value, children }) {
    return (0, jsx_runtime_1.jsx)(ThemeContext_1.ThemeContext.Provider, { value: value, children: children });
}
//# sourceMappingURL=ThemeProvider.js.map