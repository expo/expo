import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_INTERNAL_LINK = css`
  color: ${Constants.expoColors.primary[500]};
  font-size: inherit;

  :hover {
    text-decoration: underline;
  }
`;

const STYLES_EXTERNAL_LINK = css`
  color: ${Constants.expoColors.primary[500]};
  font-size: inherit;

  :hover {
    text-decoration: underline;
  }
`;

export const ExternalLink = ({ href, children }) => (
  <a href={href} className={STYLES_EXTERNAL_LINK} rel="noopener noreferrer">
    {children}
  </a>
);
