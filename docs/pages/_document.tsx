import { Global } from '@emotion/react';
import { BlockingSetInitialColorMode } from '@expo/styleguide';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import React from 'react';

import { globalExtras } from '~/global-styles/extras';
import { globalNProgress } from '~/global-styles/nprogress';
import { globalPrism } from '~/global-styles/prism';
import { globalReset } from '~/global-styles/reset';
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
          <Global styles={[globalReset, globalNProgress, globalPrism, globalTippy, globalExtras]} />
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
