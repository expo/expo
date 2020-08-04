import * as Constants from '~/common/constants';

export const globalFonts = `
  @font-face {
    font-family: '${Constants.fonts.bold}';
    src: url('/static/fonts/MaisonNeue-Bold.woff2');
    src: url('/static/fonts/MaisonNeue-Bold.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.book};
    src: url('/static/fonts/MaisonNeue-Book.woff2');
    src: url('/static/fonts/MaisonNeue-Book.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.demi};
    src: url('/static/fonts/MaisonNeue-Demi.woff2');
    src: url('/static/fonts/MaisonNeue-Demi.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.light};
    src: url('/static/fonts/MaisonNeue-Light.woff2');
    src: url('/static/fonts/MaisonNeue-Light.woff') format('woff');
  }

  @font-face {
    font-family: ${Constants.fonts.mono};
    src: url('/static/fonts/Menlo-Regular.woff2');
    src: url('/static/fonts/Menlo-Regular.woff') format('woff');
  }
`.replace(/\s/g, '');
