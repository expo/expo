import { css } from '@emotion/react';
import { typography, spacing, breakpoints } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

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
