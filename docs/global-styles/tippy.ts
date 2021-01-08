import { css } from '@emotion/core';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';

export const globalTippy = css`
  div.tippy-tooltip {
    text-align: left;
    background-color: var(--color-black90);
  }

  .tippy-popper[x-placement^='top'] .tippy-tooltip .tippy-roundarrow {
    fill: var(--color-black90);
  }

  .tippy-tooltip.expo-theme .tippy-content {
    ${paragraph};
    color: var(--color-white);
    font-family: ${Constants.fonts.book};
    background-color: var(--color-black90);
    padding: 8px;
  }

  .tippy-content a {
    color: #eee;
  }
`;
