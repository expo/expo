import { css } from '@emotion/core';

import * as Constants from '~/constants/theme';

export const globalPalette = css`
  :root {
    --color-grey: ${Constants.colors.grey};
    --color-darkGrey: ${Constants.colors.darkGrey};
    --color-codeBlack: ${Constants.expoColors.gray[200]};
    --color-codeWhite: ${Constants.expoColors.gray[700]};
    --color-white: ${Constants.expoColors.white};
    --color-black: ${Constants.colors.black};
    --color-black90: ${Constants.colors.black90};
    --color-black80: ${Constants.colors.black80};
    --color-black60: ${Constants.colors.black60};
    --color-black40: ${Constants.colors.black40};
    --color-expo: ${Constants.colors.expo};
    --color-expoLighter: ${Constants.colors.expoLighter};
    --color-lila: ${Constants.expoColors.lila};
    --color-textHighlight: ${Constants.expoColors.yellow[300]};

    --color-primary300: ${Constants.expoColors.primary[300]};
    --color-primary500: ${Constants.expoColors.primary[500]};
    --color-gray100: ${Constants.expoColors.gray[100]};
    --color-gray200: ${Constants.expoColors.gray[200]};
    --color-gray300: ${Constants.expoColors.gray[300]};
    --color-gray600: ${Constants.expoColors.gray[600]};
    --color-gray700: ${Constants.expoColors.gray[700]};
    --color-gray900: ${Constants.expoColors.gray[900]};
    --color-green200: ${Constants.expoColors.green[200]};
    --color-red200: ${Constants.expoColors.red[200]};
    --color-yellow100: ${Constants.expoColors.yellow[100]};
    --color-yellow200: ${Constants.expoColors.yellow[200]};
  }

  :root body.dark-mode {
    --color-codeBlack: ${Constants.expoColors.gray[700]};
    --color-codeWhite: ${Constants.expoColors.gray[200]};
    --color-white: #18191a;
    --color-black90: #fdfdfd;
    --color-black80: #fdfdfd;
    --color-black60: #fdfdfd;
    --color-expo: ${Constants.colors.expo};
    --color-expoLighter: ${Constants.colors.expoLighter};
    --color-textHighlight: ${Constants.expoColors.yellow[800]};

    --color-primary300: ${Constants.expoColors.primary[200]};
    --color-primary500: ${Constants.expoColors.primary[300]};
    --color-gray100: ${Constants.expoColors.gray[800]};
    --color-gray200: ${Constants.expoColors.gray[700]};
    --color-gray300: ${Constants.expoColors.gray[600]};
    --color-gray600: ${Constants.expoColors.gray[400]};
    --color-gray700: ${Constants.expoColors.gray[200]};
    --color-gray900: ${Constants.expoColors.gray[100]};
    --color-green200: ${Constants.expoColors.green[700]};
    --color-red200: ${Constants.expoColors.red[700]};
    --color-yellow100: ${Constants.expoColors.yellow[700]};
    --color-yellow200: ${Constants.expoColors.yellow[600]};
  }
`;
