import { css } from '@emotion/react';
import { typography, spacing } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

import { paragraph } from './typography';

const getAttributes = (isHeading = false) => ({
  [`data-${isHeading ? 'heading' : 'text'}`]: true,
});

const STYLES_PARAGRAPH = css`
  ${paragraph}
  margin-bottom: ${spacing[4]}px;
`;

export const P = ({ children }: PropsWithChildren<object>) => (
  <p {...getAttributes()} css={STYLES_PARAGRAPH}>
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
