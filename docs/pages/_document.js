import { Global } from '@emotion/core';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { extractCritical } from 'emotion-server';

import * as React from 'react';
import * as Analytics from '~/common/analytics';

import { globalReset } from '~/global-styles/reset';
import { globalNProgress } from '~/global-styles/nprogress';
import { globalTables } from '~/global-styles/tables';
import { globalFonts } from '~/global-styles/fonts';
import { globalPrism } from '~/global-styles/prism';
import { globalTippy } from '~/global-styles/tippy';
import { globalExtras } from '~/global-styles/extras';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const styles = extractCritical(initialProps.html);
    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            data-emotion-css={styles.ids.join(' ')}
            dangerouslySetInnerHTML={{ __html: styles.css }}
          />
        </>
      ),
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <Analytics.GoogleScript id="UA-107832480-3" />
          <script src="/static/libs/tippy/tippy.all.min.js" />
          <script src="/static/libs/nprogress/nprogress.js" />

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

          <link rel="stylesheet" href="/static/libs/algolia/algolia.min.css" />
          <link rel="stylesheet" href="/static/libs/algolia/algolia-mobile.css" />
          <link
            rel="stylesheet"
            href="https://use.fontawesome.com/releases/v5.7.2/css/all.css"
            integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
