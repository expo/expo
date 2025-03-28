/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import type { Message } from '../Data/parseLogBoxLog';

type Props = {
  message: Message;
  style: StyleProp<TextStyle>;
  plaintext?: boolean;
  maxLength?: number;
};

const cleanContent = (content: string) =>
  content.replace(/^(TransformError |Warning: (Warning: )?|Error: )/g, '');

export function LogBoxMessage(props: Props): React.ReactElement {
  const { content, substitutions }: Message = props.message;

  if (props.plaintext === true) {
    return <Text>{cleanContent(content)}</Text>;
  }

  const maxLength = props.maxLength != null ? props.maxLength : Infinity;
  const substitutionStyle: StyleProp<TextStyle> = props.style;
  const elements: React.ReactElement[] = [];
  let length = 0;
  const createUnderLength = (key: string | '-1', message: string, style?: StyleProp<TextStyle>) => {
    let cleanMessage = cleanContent(message);

    if (props.maxLength != null) {
      cleanMessage = cleanMessage.slice(0, props.maxLength - length);
    }

    if (length < maxLength) {
      elements.push(
        <Text key={key} style={style}>
          {cleanMessage}
        </Text>
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

  return <>{elements}</>;
}
