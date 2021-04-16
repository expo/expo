import { css } from '@emotion/core';
import { palette } from '@expo/styleguide';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';

export const globalTippy = css`
  div.tippy-box {
    text-align: left;
    background: ${palette.dark.black};
  }

  .tippy-box svg {
    transform: rotate(180deg);
  }

  .tippy-box[data-theme~='expo'] .tippy-content {
    ${paragraph};
    color: ${palette.dark.gray[900]};
    font-family: ${Constants.fonts.book};
    background: ${palette.dark.black};
    padding: 8px;
    margin-bottom: -10px;
  }

  .tippy-content a {
    color: ${palette.dark.gray[900]};
  }
`;
