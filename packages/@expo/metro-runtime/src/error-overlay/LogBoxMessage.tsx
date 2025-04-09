/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

import type { Message } from './Data/parseLogBoxLog';

type Props = {
  message: Message;
  maxLength?: number;
};

const cleanContent = (content: string) => content;
// const cleanContent = (content: string) =>
//   content.replace(/^(TransformError |Warning: (Warning: )?|Error: )/g, '');

export function LogBoxMessage(props: Props): React.ReactElement {
  const { content, substitutions }: Message = props.message;

  const maxLength = props.maxLength != null ? props.maxLength : Infinity;
  const substitutionStyle: StyleProp<TextStyle> = { opacity: 0.6, whiteSpace: 'pre-wrap' };
  const elements: React.ReactElement[] = [];
  let length = 0;
  const createUnderLength = (key: string | '-1', message: string, style?: StyleProp<TextStyle>) => {
    let cleanMessage = cleanContent(message);

    if (props.maxLength != null) {
      cleanMessage = cleanMessage.slice(0, props.maxLength - length);
    }

    if (length < maxLength) {
      elements.push(
        <span key={key} style={style}>
          {cleanMessage}
        </span>
      );
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

  return <div style={{ whiteSpace: 'pre-wrap' }}>{elements}</div>;
}
