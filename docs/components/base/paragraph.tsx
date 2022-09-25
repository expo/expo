import { css } from '@emotion/react';
import {
  theme,
  typography,
  iconSize,
  InfoIcon,
  spacing,
  borderRadius,
  breakpoints,
} from '@expo/styleguide';
import emojiRegex from 'emoji-regex';
import { Children, PropsWithChildren, ReactNode, BlockquoteHTMLAttributes } from 'react';

import { paragraph } from './typography';

const attributes = {
  'data-text': true,
};

const STYLES_PARAGRAPH = css`
  ${paragraph}
  margin-bottom: ${spacing[4]}px;
`;

export const P = ({ children }: PropsWithChildren<object>) => (
  <p {...attributes} css={STYLES_PARAGRAPH}>
    {children}
  </p>
);

const STYLES_BOLD_PARAGRAPH = css`
  ${STYLES_PARAGRAPH}
  font-size: inherit;
  font-family: ${typography.fontFaces.semiBold};
`;

export const B = ({ children }: PropsWithChildren<object>) => (
  <strong css={STYLES_BOLD_PARAGRAPH}>{children}</strong>
);

const STYLES_PARAGRAPH_DIV = css`
  ${STYLES_PARAGRAPH}
  display: block;

  &.is-wider {
    max-width: 1200px;
  }

  @media screen and (max-width: ${breakpoints.medium + 124}px) {
    &.is-wider {
      max-width: 100%;
      width: 100%;
    }
  }
`;

export const PDIV = ({ children }: PropsWithChildren<object>) => {
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
    grid-gap: ${spacing[3]}px;
    padding: ${spacing[3]}px;
    margin-bottom: ${spacing[4]}px;
    border-left: 4px solid ${theme.border.default};
    background: ${theme.background.secondary};
    border-radius: ${borderRadius.small};

    div {
      margin: 0;
    }

    code {
      background-color: ${theme.background.tertiary};
    }
  }

  table & {
    margin: ${spacing[2]}px 0;

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

function captureEmoji(children: ReactNode | ReactNode[]) {
  const child = firstChild(children);

  if (typeof child === 'string') {
    const emojiCapture = child.match(emojiRegex());

    if (emojiCapture && emojiCapture.length) {
      return emojiCapture[0];
    }
  }
}

function removeEmoji(emoji: string, children: ReactNode | ReactNode[]) {
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

export const Quote = ({
  children,
  ...rest
}: PropsWithChildren<BlockquoteHTMLAttributes<HTMLQuoteElement>>) => {
  let icon = (
    <div style={{ marginTop: 2 }}>
      <InfoIcon size={iconSize.small} />
    </div>
  );

  const newChildren = Children.map(children, child => {
    const { props } = child as JSX.Element;
    const emoji = captureEmoji(props?.children);

    if (emoji) {
      icon = <div>{emoji}</div>;
      const updatedChildren = removeEmoji(emoji, props?.children);

      return Object.assign({}, child, {
        children: updatedChildren,
        props: {
          ...props,
          children: removeEmoji(emoji, props?.children),
        },
      });
    }

    return child;
  });

  return (
    <blockquote {...attributes} css={STYLES_BLOCKQUOTE} {...rest}>
      {icon}
      <div>{newChildren}</div>
    </blockquote>
  );
};
