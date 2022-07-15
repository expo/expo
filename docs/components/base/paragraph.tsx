import { css } from '@emotion/react';
import { theme, typography, iconSize, InfoIcon } from '@expo/styleguide';
import emojiRegex from 'emoji-regex';
import * as React from 'react';

import { paragraph } from './typography';

import * as Constants from '~/constants/theme';

const attributes = {
  'data-text': true,
};

const STYLES_PARAGRAPH = css`
  ${paragraph}
  margin-bottom: 1rem;
`;

export const P: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
  <p {...attributes} css={STYLES_PARAGRAPH}>
    {children}
  </p>
);

const STYLES_BOLD_PARAGRAPH = css`
  ${paragraph}
  font-size: inherit;
  font-family: ${typography.fontFaces.semiBold};
  font-weight: 500;
`;

export const B: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
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

export const PDIV: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const isWider = (children as JSX.Element)?.props?.snackId;
  return (
    <div {...attributes} css={STYLES_PARAGRAPH_DIV} className={isWider ? 'is-wider' : ''}>
      {children}
    </div>
  );
};

const STYLES_BLOCKQUOTE = css`
  & {
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
  }

  table & {
    margin: 0.5rem 0;

    &:first-of-type {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

function firstChild<T>(children: T | T[]): T {
  if (Array.isArray(children)) {
    return children[0];
  }
  return children;
}

function captureEmoji(children: React.ReactNode | React.ReactNode[]) {
  const child = firstChild(children);

  if (typeof child === 'string') {
    const emojiCapture = child.match(emojiRegex());

    if (emojiCapture && emojiCapture.length) {
      return emojiCapture[0];
    }
  }
}

function removeEmoji(emoji: string, children: React.ReactNode | React.ReactNode[]) {
  const child = firstChild(children) || '';

  if (typeof child === 'string') {
    const modifiedChild = child.replace(emoji, '');

    if (Array.isArray(children)) {
      return [modifiedChild, ...children.slice(1)];
    } else {
      return modifiedChild;
    }
  }

  return child;
}

export const Quote = ({ children, ...rest }: React.PropsWithChildren<object>) => {
  let icon: React.ReactNode = (
    <div style={{ marginTop: 2 }}>
      <InfoIcon size={iconSize.small} />
    </div>
  );

  // todo(simek): Refactor this component
  const newChildren = React.Children.map(children, child => {
    // @ts-ignore
    const { props } = child;
    const emoji = captureEmoji(props?.children);

    if (emoji) {
      icon = emoji;
      const childData = Object.assign({}, child) || {};

      return {
        ...childData,
        props: {
          ...props,
          children: removeEmoji(emoji, props?.children),
        },
      };
    }

    return child;
  }) as React.ReactNode;

  return (
    <blockquote {...attributes} css={STYLES_BLOCKQUOTE} {...rest}>
      <div>{icon}</div>
      <div>{newChildren}</div>
    </blockquote>
  );
};
