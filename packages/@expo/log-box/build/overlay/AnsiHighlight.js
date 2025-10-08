"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ansi = void 0;
exports.AnsiUnsafe = AnsiUnsafe;
/**
 * Copyright (c) 650 Industries.
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
    'ansi-black': 'rgb(27, 27, 27)',
    'ansi-red': 'var(--expo-log-syntax-red)',
    'ansi-green': '#ffca16',
    'ansi-yellow': 'var(--expo-log-syntax-orange)',
    'ansi-cyan': '#de51a8',
    'ansi-magenta': '#6abaff',
    'ansi-blue': 'rgb(125, 169, 199)',
    // Instead of white, use the default color provided to the component
    // 'ansi-white': 'rgb(216, 216, 216)',
    'ansi-bright-black': 'rgb(98, 98, 98)',
    'ansi-bright-red': 'rgb(187, 86, 83)',
    'ansi-bright-green': 'rgb(144, 157, 98)',
    'ansi-bright-yellow': 'rgb(234, 193, 121)',
    'ansi-bright-blue': 'rgb(125, 169, 199)',
    'ansi-bright-magenta': 'rgb(176, 101, 151)',
    'ansi-bright-cyan': 'rgb(140, 220, 216)',
    'ansi-bright-white': 'rgb(247, 247, 247)',
};
class Ansi extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error('AnsiSafe caught an error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return react_1.default.createElement(react_native_1.Text, { style: this.props.style }, "Error rendering ANSI text.");
        }
        return react_1.default.createElement(AnsiUnsafe, { text: this.props.text || '', style: this.props.style });
    }
}
exports.Ansi = Ansi;
function AnsiUnsafe({ text, style }) {
    // TMP
    if (!text) {
        return react_1.default.createElement(react_native_1.Text, { style: style }, "Text not provided to Ansi component.");
    }
    let commonWhitespaceLength = Infinity;
    const parsedLines = text.split(/\n/).map((line) => anser_1.default.ansiToJson(line, {
        json: true,
        remove_empty: true,
        use_classes: true,
    }));
    parsedLines.map((lines) => {
        // The third item on each line includes the whitespace of the source code.
        // We are looking for the least amount of common whitespace to trim all lines.
        // Example: Array [" ", " 96 |", "     text", ...]
        const match = lines[2] && lines[2]?.content?.match(/^ +/);
        const whitespaceLength = (match && match[0]?.length) || 0;
        if (whitespaceLength < commonWhitespaceLength) {
            commonWhitespaceLength = whitespaceLength;
        }
    });
    const getText = (content, key) => {
        if (key === 1) {
            // Remove the vertical bar after line numbers
            return content.replace(/\| $/, ' ');
        }
        else if (key === 2 && commonWhitespaceLength < Infinity) {
            // Remove common whitespace at the beginning of the line
            return content.substr(commonWhitespaceLength);
        }
        else {
            return content;
        }
    };
    return (react_1.default.createElement(react_1.default.Fragment, null, parsedLines.map((items, i) => (react_1.default.createElement(react_native_1.View, { style: styles.line, key: i }, items.map((bundle, key) => {
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
const styles = react_native_1.StyleSheet.create({
    line: {
        flexDirection: 'row',
    },
});
