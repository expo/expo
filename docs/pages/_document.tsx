import { Global } from '@emotion/core';
import { BlockingSetInitialColorMode } from '@expo/styleguide';
import { extractCritical } from 'emotion-server';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import * as React from 'react';

import { getInitGoogleScriptTag, getGoogleScriptTag } from '~/common/analytics';
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
          <script src="/static/libs/tippy/tippy.all.min.js" />

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

          <link rel="stylesheet" href="/static/libs/algolia/algolia.css" />
          <link rel="stylesheet" href="/static/libs/algolia/algolia-mobile.css" />
          <link
            rel="stylesheet"
            href="https://use.fontawesome.com/releases/v5.7.2/css/all.css"
            integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr"
            crossOrigin="anonymous"
          />

          {getInitGoogleScriptTag({ id: 'UA-107832480-3' })}
          {getGoogleScriptTag()}
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
