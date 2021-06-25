import { Global } from '@emotion/react';
import { BlockingSetInitialColorMode } from '@expo/styleguide';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import React from 'react';

import { globalExtras } from '~/global-styles/extras';
import { globalFonts } from '~/global-styles/fonts';
import { globalNProgress } from '~/global-styles/nprogress';
import { globalPrism } from '~/global-styles/prism';
import { globalReset } from '~/global-styles/reset';
import { globalTables } from '~/global-styles/tables';
import { globalTippy } from '~/global-styles/tippy';

export default class MyDocument extends Document<{ css?: string }> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: <>{initialProps.styles}</>,
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <Global
            styles={[
              globalFonts,
              globalReset,
              globalNProgress,
              globalTables,
              // globalPrism,
              globalTippy,
              globalExtras,
            ]}
          />

          <link
            rel="preload"
            href="/static/fonts/Inter-Regular.woff2?v=3.15"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <BlockingSetInitialColorMode />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
