import emojiRegex from 'emoji-regex';
import React, { ReactNode, ReactElement } from 'react';

import { InfoNote, WarningNote, ErrorNote, NoteProps } from '../Note';

type BlockquoteSeverity = 'Info' | 'Warning' | 'Error';

export const Blockquote = ({ children, ...rest }: { children: ReactNode }) => {
  const { icon, childrenWithoutIcon } = pullEmojiFromChildren(children);
  const Component = severityComponent[emojiSeverity[icon] || 'Info'];

  return (
    <Component icon={icon} {...rest}>
      {childrenWithoutIcon}
    </Component>
  );
};

const severityComponent: Record<BlockquoteSeverity, (props: NoteProps) => JSX.Element> = {
  Info: InfoNote,
  Warning: WarningNote,
  Error: ErrorNote,
};

const emojiSeverity: Record<string, BlockquoteSeverity> = {
  '⚠️': 'Warning',
};

function pullEmojiFromChildren(children: ReactNode) {
  let icon: string = '';
  const childrenWithoutIcon = React.Children.map(children, child => {
    if (!isElement(child)) {
      return child;
    }

    const emoji = getChildEmoji(child.props.children);
    if (emoji) {
      icon = emoji;
      return {
        ...child,
        props: {
          ...child.props,
          children: removeChildEmoji(emoji, child.props.children),
        },
      };
    }

    return child;
  });

  return { icon, childrenWithoutIcon: childrenWithoutIcon || children };
}

function isElement(element: ReactNode): element is ReactElement {
  return !!(element as ReactElement)?.props;
}

function first<T>(children: T | T[]): T {
  return Array.isArray(children) ? children[0] : children;
}

function getChildEmoji(children: ReactNode) {
  const child = first(children);

  if (typeof child === 'string') {
    const emojiCapture = child.match(emojiRegex());

    if (emojiCapture && emojiCapture.length) {
      return emojiCapture[0];
    }
  }
}

function removeChildEmoji(emoji: string, children: string[]) {
  const child = first(children);
  const modifiedChild = child.replace(emoji, '');

  if (Array.isArray(children)) {
    return [modifiedChild, ...children.slice(1)];
  } else {
    return modifiedChild;
  }
}
