import Document, { Head, Main, NextScript } from 'next/document';
import { extractCritical } from 'emotion-server';
import { hydrate } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

import { LATEST_VERSION } from '~/common/versions';

if (typeof window !== 'undefined') {
  hydrate(window.__NEXT_DATA__.ids);
}

export default class MyDocument extends Document {
  static getInitialProps({ renderPage }) {
    const page = renderPage();
    const styles = extractCritical(page.html);
    return { ...page, ...styles };
  }

  constructor(props) {
    super(props);
    const { __NEXT_DATA__, ids } = props;
    if (ids) {
      __NEXT_DATA__.ids = ids;
    }
  }

  render() {
    return (
      <html>
        <Head>
          <style dangerouslySetInnerHTML={{ __html: this.props.css }} />

          <script
            dangerouslySetInnerHTML={{
              __html: `
             window._NODE_ENV = '${process.env.NODE_ENV}';
             window._LATEST_VERSION = '${LATEST_VERSION}';
              `,
            }}
          />

          {/* Reset */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
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

              ::selection {
                background-color: ${Constants.colors.lila};
                color: ${Constants.colors.black};
              }
          `,
            }}
          />

          {/* Top progress bar */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            #nprogress {
              pointer-events: none;
            }

            #nprogress .bar {
              position: fixed;
              z-index: 2000;
              top: 0;
              left: 0;
              width: 100%;
              height: 2px;
              background: ${Constants.colors.expoLighter};
            }

            #nprogress .spinner {
              display: none;
            }
          `,
            }}
          />

          {/* Fonts */}
          <style
            dangerouslySetInnerHTML={{
              __html: `

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
                  src: url('/static/fonts/MaisonNeue-Mono.woff2');
                  src: url('/static/fonts/MaisonNeue-Mono.woff') format('woff');
                }

                html {
                  font-family: ${Constants.fontFamilies.book};
                  overflow-wrap: break-word;
                }
          `,
            }}
          />

          {/* Table styles */}
          <style
            dangerouslySetInnerHTML={{
              __html: `

              table {
                margin-bottom: 1rem;
                font-size: 1rem;
                line-height: 1.45rem;
                border-collapse: collapse;
                border: 1px solid hsla(0,0%,0%,0.12);
                width: 100%;
              }

              thead {
                text-align: left;
              }

              th, td {
                text-align: left;
                border-bottom: 1px solid hsla(0,0%,0%,0.12);
                font-feature-settings: "tnum";
                -moz-font-feature-settings: "tnum";
                -ms-font-feature-settings: "tnum";
                -webkit-font-feature-settings: "tnum";
                padding-left: 0.96667rem;
                padding-right: 0.96667rem;
                padding-top: 0.725rem;
                padding-bottom: calc(0.725rem - 1px);
              }

              th {
                font-weight: bold;
              }
          `,
            }}
          />

          {/* Lists */}
          <style
            dangerouslySetInnerHTML={{
              __html: `

              /* Lists and permalinks */

              li {
                font-size: 1rem;
                line-height: 1.725rem;
                margin-bottom: 1.25rem;
              }

              ol {
                padding-left: 20px;
              }

              li a.anchor {
                margin-left: -20px;
                float: left;
              }

              li > a.anchor > svg.bullet-icon {
                position: absolute;
                margin-top: 3px;
                visibility: visible;
              }

              li a.anchor > svg.anchor-icon {
                position: absolute;
                margin-top: 3px;
                visibility: hidden;
              }

              li:hover > a.anchor > svg.bullet-icon {
                visibility: hidden;
              }

              li:hover > a.anchor > svg.anchor-icon {
                visibility: visible;
              }

              ol li a.anchor > svg.bullet-icon {
                display: none;
              }

              ol li a.anchor svg.anchor-icon {
                background: #fff;
                padding: 3px;
              }

              svg.anchor-icon {
                width: 13px;
                height: 13px;
              }

              @media screen and (max-width: ${Constants.breakpoints.mobile}) {
                svg.anchor-icon {
                  width: 10px;
                  height: 10px;
                }
              }
          `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
