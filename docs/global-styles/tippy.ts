import { css } from '@emotion/core';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';

export const globalTippy = css`
  div.tippy-tooltip {
    text-align: left;
    background: ${Constants.expoColors.black};
  }

  .tippy-popper[x-placement^='top'] .tippy-tooltip .tippy-roundarrow {
    fill: ${Constants.expoColors.black};
  }

  .tippy-tooltip.expo-theme .tippy-content {
    ${paragraph};
    color: ${Constants.colors.white};
    font-family: ${Constants.fonts.book};
    background: ${Constants.expoColors.black};
    padding: 8px;
  }

  .tippy-content a {
    color: #eee;
  }
`;
