"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ansi = void 0;
/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const anser_1 = __importDefault(require("anser"));
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
// Afterglow theme from https://iterm2colorschemes.com/
const COLORS = {
    "ansi-black": "rgb(27, 27, 27)",
    "ansi-red": "rgb(187, 86, 83)",
    "ansi-green": "rgb(144, 157, 98)",
    "ansi-yellow": "rgb(234, 193, 121)",
    "ansi-blue": "rgb(125, 169, 199)",
    "ansi-magenta": "rgb(176, 101, 151)",
    "ansi-cyan": "rgb(140, 220, 216)",
    // Instead of white, use the default color provided to the component
    // 'ansi-white': 'rgb(216, 216, 216)',
    "ansi-bright-black": "rgb(98, 98, 98)",
    "ansi-bright-red": "rgb(187, 86, 83)",
    "ansi-bright-green": "rgb(144, 157, 98)",
    "ansi-bright-yellow": "rgb(234, 193, 121)",
    "ansi-bright-blue": "rgb(125, 169, 199)",
    "ansi-bright-magenta": "rgb(176, 101, 151)",
    "ansi-bright-cyan": "rgb(140, 220, 216)",
    "ansi-bright-white": "rgb(247, 247, 247)",
};
function Ansi({ text, style, }) {
    let commonWhitespaceLength = Infinity;
    const parsedLines = text.split(/\n/).map((line) => anser_1.default.ansiToJson(line, {
        json: true,
        remove_empty: true,
        use_classes: true,
    }));
    parsedLines.map((lines) => {
        var _a, _b, _c;
        // The third item on each line includes the whitespace of the source code.
        // We are looking for the least amount of common whitespace to trim all lines.
        // Example: Array [" ", " 96 |", "     text", ...]
        const match = lines[2] && ((_b = (_a = lines[2]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.match(/^ +/));
        const whitespaceLength = (match && ((_c = match[0]) === null || _c === void 0 ? void 0 : _c.length)) || 0;
        if (whitespaceLength < commonWhitespaceLength) {
            commonWhitespaceLength = whitespaceLength;
        }
    });
    const getText = (content, key) => {
        if (key === 1) {
            // Remove the vertical bar after line numbers
            return content.replace(/\| $/, " ");
        }
        else if (key === 2 && commonWhitespaceLength < Infinity) {
            // Remove common whitespace at the beginning of the line
            return content.substr(commonWhitespaceLength);
        }
        else {
            return content;
        }
    };
    return (react_1.default.createElement(react_native_1.View, null, parsedLines.map((items, i) => (react_1.default.createElement(react_native_1.View, { style: styles.line, key: i }, items.map((bundle, key) => {
        const textStyle = bundle.fg && COLORS[bundle.fg]
            ? {
                backgroundColor: bundle.bg && COLORS[bundle.bg],
                color: bundle.fg && COLORS[bundle.fg],
            }
            : {
                backgroundColor: bundle.bg && COLORS[bundle.bg],
            };
        return (react_1.default.createElement(react_native_1.Text, { style: [style, textStyle], key: key }, getText(bundle.content, key)));
    }))))));
}
exports.Ansi = Ansi;
const styles = react_native_1.StyleSheet.create({
    line: {
        flexDirection: "row",
    },
});
//# sourceMappingURL=AnsiHighlight.js.map