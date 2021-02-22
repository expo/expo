import { css } from '@emotion/core';
import { colors } from '@expo/styleguide';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';

export const globalTippy = css`
  div.tippy-tooltip {
    text-align: left;
    background: ${colors.dark.black};
  }

  .tippy-popper[x-placement^='top'] .tippy-tooltip .tippy-roundarrow {
    fill: ${colors.dark.black};
  }

  .tippy-tooltip.expo-theme .tippy-content {
    ${paragraph};
    color: ${colors.dark.gray[900]};
    font-family: ${Constants.fonts.book};
    background: ${colors.dark.black};
    padding: 8px;
  }

  .tippy-content a {
    color: ${colors.dark.gray[900]};
  }
`;
