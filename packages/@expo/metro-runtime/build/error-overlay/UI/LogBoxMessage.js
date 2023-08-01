/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { Text } from 'react-native';
const cleanContent = (content) => content.replace(/^(TransformError |Warning: (Warning: )?|Error: )/g, '');
export function LogBoxMessage(props) {
    const { content, substitutions } = props.message;
    if (props.plaintext === true) {
        return React.createElement(Text, null, cleanContent(content));
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
            elements.push(React.createElement(Text, { key: key, style: style }, cleanMessage));
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
    return React.createElement(React.Fragment, null, elements);
}
//# sourceMappingURL=LogBoxMessage.js.map