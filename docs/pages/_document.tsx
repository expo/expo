import { Global } from '@emotion/react';
import { BlockingSetInitialColorMode } from '@expo/styleguide';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import dynamic from 'next/dynamic';
import React from 'react';

import { getInitGoogleScriptTag } from '~/common/analytics';
import { globalExtras } from '~/global-styles/extras';
import { globalFonts } from '~/global-styles/fonts';
import { globalNProgress } from '~/global-styles/nprogress';
import { globalPrism } from '~/global-styles/prism';
import { globalReset } from '~/global-styles/reset';
import { globalTables } from '~/global-styles/tables';
import { globalTippy } from '~/global-styles/tippy';

const DynamicLoadAnalytics = dynamic<any>(() =>
  import('~/common/analytics').then(mod => mod.LoadAnalytics)
);

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
              globalPrism,
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

          {getInitGoogleScriptTag({ id: 'UA-107832480-3' })}
        </Head>
        <body>
          <DynamicLoadAnalytics />
          <BlockingSetInitialColorMode />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
