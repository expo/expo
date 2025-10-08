import React from 'react';

import { SHOW_MORE_MESSAGE_LENGTH } from './Constants';
import { Message } from '../Data/Types';

export default function ShowMoreButton({
  message,
  collapsed,
  onPress,
}: {
  collapsed: boolean;
  message: Message;
  onPress: () => void;
}) {
  if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
    return null;
  }
  return (
    <button
      style={{
        color: 'var(--expo-log-color-label)',
        fontFamily: 'var(--expo-log-font-family)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        border: 'none',
        opacity: 0.7,
        fontSize: 14,
      }}
      onClick={onPress}>
      ... See more
    </button>
  );
}
