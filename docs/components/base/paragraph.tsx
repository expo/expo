import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import emojiRegex from 'emoji-regex';
import * as React from 'react';

import { paragraph } from './typography';

import { Info } from '~/components/icons/Info';
import * as Constants from '~/constants/theme';

const attributes = {
  'data-text': true,
};

const STYLES_PARAGRAPH = css`
  ${paragraph}
  margin-bottom: 1rem;
`;

export const P: React.FC = ({ children }) => (
  <p {...attributes} css={STYLES_PARAGRAPH}>
    {children}
  </p>
);

const STYLES_BOLD_PARAGRAPH = css`
  ${paragraph}
  font-size: inherit;
  font-family: ${Constants.fontFamilies.bold};
  font-weight: 500;
`;

export const B: React.FC = ({ children }) => (
  <strong css={STYLES_BOLD_PARAGRAPH}>{children}</strong>
);

const STYLES_PARAGRAPH_DIV = css`
  ${paragraph}
  display: block;
  margin-bottom: 1rem;

  &.is-wider {
    max-width: 1200px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    &.is-wider {
      max-width: 100%;
      width: 100%;
    }
  }
`;

export const PDIV: React.FC = ({ children }) => {
  const isWider = (children as JSX.Element)?.props?.snackId;
  return (
    <div {...attributes} css={STYLES_PARAGRAPH_DIV} className={isWider ? 'is-wider' : ''}>
      {children}
    </div>
  );
};

const STYLES_BLOCKQUOTE = css`
  ${paragraph}
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 12px;
  padding: 12px;
  margin-bottom: 1rem;
  border-left: 4px solid ${theme.border.default};
  background: ${theme.background.secondary};
  border-radius: 4px;

  div {
    margin: 0;
  }

  code {
    background-color: ${theme.background.tertiary};
  }
`;

function firstChild<T>(children: T | T[]): T {
  if (Array.isArray(children)) {
    return children[0];
  }
  return children;
}

function captureEmoji(children: React.ReactNode) {
  const child = firstChild(children);

  if (typeof child === 'string') {
    const emojiCapture = child.match(emojiRegex());

    if (emojiCapture && emojiCapture.length) {
      return emojiCapture[0];
    }
  }
}

function removeEmoji(emoji: string, children: string[]) {
  const child = firstChild(children) || '';

  const modifiedChild = child.replace(emoji, '');

  if (Array.isArray(children)) {
    return [modifiedChild, ...children.slice(1)];
  } else {
    return modifiedChild;
  }
}

export const Quote = ({ children, ...rest }: { children: JSX.Element | JSX.Element[] }) => {
  let icon: React.ReactNode = (
    <div style={{ marginTop: 2 }}>
      <Info size={16} />
    </div>
  );

  const newChildren: JSX.Element[] = React.Children.map(children, child => {
    const emoji = captureEmoji(child?.props?.children);

    if (emoji) {
      icon = emoji;

      return {
        ...child,
        props: {
          ...child?.props,
          children: removeEmoji(emoji, child?.props?.children),
        },
      };
    }

    return child;
  });

  return (
    <blockquote {...attributes} css={STYLES_BLOCKQUOTE} {...rest}>
      <div>{icon}</div>
      <div>{newChildren}</div>
    </blockquote>
  );
};
