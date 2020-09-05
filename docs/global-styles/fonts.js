import * as Constants from '~/common/constants';

export const globalFonts = `
  @font-face {
    font-family: '${Constants.fonts.bold}';
    src: url('/static/fonts/Inter-SemiBold.woff2');
    src: url('/static/fonts/Inter-SemiBold.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.book};
    src: url('/static/fonts/Inter-Regular.woff2');
    src: url('/static/fonts/Inter-Regular.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.demi};
    src: url('/static/fonts/Inter-Medium.woff2');
    src: url('/static/fonts/Inter-Medium.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.light};
    src: url('/static/fonts/Inter-Regular.woff2');
    src: url('/static/fonts/Inter-Regular.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.mono};
    src: url('/static/fonts/Menlo-Regular.woff2');
    src: url('/static/fonts/Menlo-Regular.woff') format('woff');
  }
`.replace(/\s/g, '');
