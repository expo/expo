import { css } from '@emotion/core';

import * as Constants from '~/constants/theme';

const STYLES_EXTERNAL_LINK = css`
  color: ${Constants.expoColors.primary[500]};
  font-size: inherit;

  :hover {
    text-decoration: underline;
  }
`;

export const ExternalLink = ({ href, children }) => (
  <a href={href} css={STYLES_EXTERNAL_LINK} rel="noopener noreferrer">
    {children}
  </a>
);
