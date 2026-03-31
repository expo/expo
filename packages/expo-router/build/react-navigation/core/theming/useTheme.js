"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTheme = useTheme;
const react_1 = require("react");
const ThemeContext_1 = require("./ThemeContext");
function useTheme() {
    const theme = (0, react_1.use)(ThemeContext_1.ThemeContext);
    if (theme == null) {
        throw new Error("Couldn't find a theme. Is your component inside NavigationContainer or does it have a theme?");
    }
    return theme;
}
//# sourceMappingURL=useTheme.js.map