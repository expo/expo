import { css } from '@emotion/core';
import emojiRegex from 'emoji-regex';
import * as React from 'react';

import * as Constants from '~/constants/theme';
import { Info } from '~/components/icons/Info';
import { paragraph } from './typography';

const attributes = {
  'data-text': true,
};

const STYLES_PARAGRAPH = css`
  ${paragraph}
  margin-bottom: 1rem;
`;

export const P = ({ children }) => (
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

const B = ({ children }) => <strong css={STYLES_BOLD_PARAGRAPH}>{children}</strong>;

P.B = B;

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

export const PDIV = ({ children }) => {
  const isWider = children.props && children.props.snackId;
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
  border-left: 4px solid ${Constants.expoColors.gray[250]};
  background: ${Constants.expoColors.gray[100]};
  border-radius: 4px;

  div {
    margin: 0;
  }

  code {
    background-color: ${Constants.expoColors.gray[200]};
  }
`;

function firstChild(children) {
  if (Array.isArray(children)) {
    return children[0];
  }

  return children;
}

function captureEmoji(children) {
  let child = firstChild(children);

  if (typeof child === 'string') {
    const emojiCapture = child.match(emojiRegex);

    if (emojiCapture && emojiCapture.length) {
      return emojiCapture[0];
    }
  }
}

function removeEmoji(emoji, children) {
  const child = firstChild(children) || '';

  const modifiedChild = child.replace(emoji, '');

  if (Array.isArray(children)) {
    return [modifiedChild, ...children.slice(1)];
  } else {
    return modifiedChild;
  }
}

export const Quote = ({ children }) => {
  let icon = (
    <div style={{ marginTop: 2 }}>
      <Info size={16} />
    </div>
  );

  const _children = React.Children.map(children, children => {
    const emoji = captureEmoji(children.props.children);

    if (emoji) {
      icon = emoji;

      return {
        ...children,
        props: {
          ...children.props,
          children: removeEmoji(emoji, children.props.children),
        },
      };
    }

    return children;
  });

  return (
    <blockquote {...attributes} css={STYLES_BLOCKQUOTE}>
      <div>{icon}</div>
      <div>{_children}</div>
    </blockquote>
  );
};
