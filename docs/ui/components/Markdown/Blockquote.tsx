import emojiRegex from 'emoji-regex';
import React, { ReactNode, ComponentProps, isValidElement } from 'react';

import { Callout } from '~/ui/components/Callout';

export const Blockquote = ({ children, ...rest }: ComponentProps<typeof Callout>) => {
  const { emoji, childrenWithoutEmoji } = separateEmojiFromChild(children);
  const type = emoji ? emojiType[emoji] : undefined;
  const icon = type ? undefined : emoji;
  return (
    <Callout type={type} icon={icon} {...rest}>
      {childrenWithoutEmoji}
    </Callout>
  );
};

const emojiType: Record<string, ComponentProps<typeof Callout>['type']> = {
  '⚠️': 'warning',
  '❌': 'error',
};

function separateEmojiFromChild(children: ReactNode) {
  let emoji: string | undefined;
  const childrenWithoutEmoji = React.Children.map(children, child => {
    // Abort if we found the first emoji already
    if (emoji) return child;
    // If the children is passed as string, extract emoji from string
    if (typeof child === 'string') {
      emoji = getEmojiFromChild(child);
      return !emoji ? child : removeEmojiFromChild(emoji, child);
    }
    // If the children is passed with wrapping P component, extract emoji from children
    if (isValidElement(child)) {
      emoji = getEmojiFromChild(child.props.children);
      return !emoji
        ? child
        : {
            ...child,
            props: {
              ...child.props,
              children: removeEmojiFromChild(emoji, child.props.children),
            },
          };
    }
    return child;
  });

  return { emoji, childrenWithoutEmoji: childrenWithoutEmoji || children };
}

function getEmojiFromChild(children: ReactNode) {
  const child = Array.isArray(children) ? children[0] : children;

  if (typeof child === 'string') {
    const emojiCapture = child.match(emojiRegex());
    if (emojiCapture && emojiCapture.length) {
      return emojiCapture[0];
    }
  }
}

function removeEmojiFromChild(emoji: string, children: ReactNode | ReactNode[]) {
  if (typeof children === 'string') {
    return children.replace(emoji, '');
  }

  if (Array.isArray(children) && typeof children[0] === 'string') {
    return [children[0].replace(emoji, ''), ...children.slice(1)];
  }

  return children;
}
