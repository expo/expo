import * as Constants from '~/constants/theme';

export const globalReset = `
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center,
    dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend,
    table, caption, tbody, tfoot, thead, tr, th, td,
    article, aside, canvas, details, embed,
    figure, figcaption, footer, header, hgroup,
    menu, nav, output, ruby, section, summary,
    time, mark, audio, video {
      font-weight: 400;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: 0;
      vertical-align: baseline;
    }

    article, aside, details, figcaption, figure,
    footer, header, hgroup, menu, nav, section {
      display: block;
    }

    img {
      max-width: 768px;
      width: 100%;
    }

    a {
      -webkit-tap-highlight-color: rgba(0,0,0,0);
      color: ${Constants.colors.expoLighter};
    }

    body {
      font-family: ${Constants.fonts.book};
      text-rendering: optimizeLegibility;
      font-size: 16px;
    }

    @media screen and (max-width: ${Constants.breakpoints.mobile}) {
      body {
        font-size: 14px;
      }
    }

    ::selection {
      background-color: ${Constants.colors.lila};
      color: ${Constants.colors.black};
    }
`;
