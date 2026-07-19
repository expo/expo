/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';

import type { Message } from '../Data/Types';

export function LogBoxMessage(props: { message: Message; maxLength?: number }): React.ReactElement {
  const { content, substitutions }: Message = props.message;

  const maxLength = props.maxLength != null ? props.maxLength : Infinity;
  const substitutionStyle: React.CSSProperties = { opacity: 0.6 };
  const elements: React.ReactElement[] = [];
  let length = 0;
  const createUnderLength = (key: string | '-1', message: string, style?: React.CSSProperties) => {
    let cleanMessage = message;

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

  return <>{elements}</>;
}
