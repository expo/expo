"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBoxMessage = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const cleanContent = (content) => content.replace(/^(TransformError |Warning: (Warning: )?|Error: )/g, '');
function LogBoxMessage(props) {
    const { content, substitutions } = props.message;
    if (props.plaintext === true) {
        return react_1.default.createElement(react_native_1.Text, null, cleanContent(content));
    }
    const maxLength = props.maxLength != null ? props.maxLength : Infinity;
    const substitutionStyle = props.style;
    const elements = [];
    let length = 0;
    const createUnderLength = (key, message, style) => {
        let cleanMessage = cleanContent(message);
        if (props.maxLength != null) {
            cleanMessage = cleanMessage.slice(0, props.maxLength - length);
        }
        if (length < maxLength) {
            elements.push(react_1.default.createElement(react_native_1.Text, { key: key, style: style }, cleanMessage));
        }
        length += cleanMessage.length;
    };
    const lastOffset = substitutions.reduce((prevOffset, substitution, index) => {
        const key = String(index);
        if (substitution.offset > prevOffset) {
            const prevPart = content.substr(prevOffset, substitution.offset - prevOffset);
            createUnderLength(key, prevPart);
        }
        const substititionPart = content.substr(substitution.offset, substitution.length);
        createUnderLength(key + '.5', substititionPart, substitutionStyle);
        return substitution.offset + substitution.length;
    }, 0);
    if (lastOffset < content.length) {
        const lastPart = content.substr(lastOffset);
        createUnderLength('-1', lastPart);
    }
    return react_1.default.createElement(react_1.default.Fragment, null, elements);
}
exports.LogBoxMessage = LogBoxMessage;
//# sourceMappingURL=LogBoxMessage.js.map