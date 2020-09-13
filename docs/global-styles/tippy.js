import * as Constants from '~/constants/theme';
import { paragraph } from '~/components/base/typography';

export const globalTippy = `
  div.tippy-tooltip {
    text-align: left;
    background: ${Constants.expoColors.black};
  }

  .tippy-popper[x-placement^='top'] .tippy-tooltip .tippy-roundarrow {
    fill: ${Constants.expoColors.black};
  }

  .tippy-tooltip.expo-theme .tippy-content {
    ${paragraph},
    color: ${Constants.colors.white};
    font-family: ${Constants.fonts.book};
    background: ${Constants.expoColors.black};
    padding: 8px;
  }

  .tippy-content a {
    color: #eee;
  }
`;
