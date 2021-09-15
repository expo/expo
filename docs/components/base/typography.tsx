import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';

import * as Constants from '~/constants/theme';

export const h1 = css`
  font-family: ${Constants.fonts.bold};
  color: ${theme.text.default};
  font-size: 48px;
  line-height: 120%;
  letter-spacing: -0.022em;
  font-weight: 500;
`;

export const h2 = css`
  font-family: ${Constants.fonts.demi};
  color: ${theme.text.default};
  font-size: 30px;
  line-height: 130%;
  letter-spacing: -0.021em;
  font-weight: 500;
`;

export const h3 = css`
  font-family: ${Constants.fonts.demi};
  color: ${theme.text.default};
  font-size: 24px;
  line-height: 130%;
  letter-spacing: -0.019em;
  font-weight: 500;
`;

export const h4 = css`
  font-family: ${Constants.fonts.bold};
  color: ${theme.text.default};
  font-size: 18px;
  line-height: 140%;
  letter-spacing: -0.01em;
  font-weight: 500;
`;

export const paragraph = css`
  font-family: ${Constants.fontFamilies.book};
  color: ${theme.text.default};
  font-weight: 400;
  font-size: 16px;
  line-height: 160%;
  letter-spacing: -0.011em;
`;
