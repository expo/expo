import { css } from '@emotion/react';
import { palette } from '@expo/styleguide';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';

export const globalTippy = css`
  div.tippy-box {
    text-align: left;
    background: ${palette.dark.black};
    border-radius: 4px;
    margin-bottom: 10px;
  }

  .tippy-box svg {
    transform: rotate(180deg);
  }

  .tippy-box[data-theme~='expo'] .tippy-content {
    ${paragraph};
    color: ${palette.dark.gray[900]};
    font-family: ${Constants.fonts.book};
    font-weight: 400;
    font-size: 16px;
    line-height: 160%;
    background: ${palette.dark.black};
    padding: 18px;
    margin-bottom: -10px;
    border-radius: 4px;
  }

  .tippy-content a {
    color: ${palette.dark.gray[900]};
  }
`;
