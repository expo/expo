import Document, { Head, Main, NextScript } from 'next/document';
import { extractCritical } from 'emotion-server';
import { hydrate } from 'react-emotion';

import * as React from 'react';
import * as Analytics from '~/common/analytics';

import { globalReset } from '~/global-styles/reset';
import { globalNProgress } from '~/global-styles/nprogress';
import { globalTables } from '~/global-styles/tables';
import { globalFonts } from '~/global-styles/fonts';
import { globalPrism } from '~/global-styles/prism';
import { globalTippy } from '~/global-styles/tippy';
import { globalExtras } from '~/global-styles/extras';

if (typeof window !== 'undefined') {
  hydrate(window.__NEXT_DATA__.ids);
}

export default class MyDocument extends Document {
  static getInitialProps(opts) {
    const { renderPage } = opts;
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
      <html lang="en">
        <Head>
          <Analytics.GoogleScript id="UA-107832480-3" />
          <script src="/static/libs/tippy/tippy.all.min.js" />
          <script src="/static/libs/nprogress/nprogress.js" />

          <style dangerouslySetInnerHTML={{ __html: this.props.css }} />
          <style dangerouslySetInnerHTML={{ __html: globalFonts }} />
          <style dangerouslySetInnerHTML={{ __html: globalReset }} />
          <style dangerouslySetInnerHTML={{ __html: globalNProgress }} />
          <style dangerouslySetInnerHTML={{ __html: globalTables }} />
          <style dangerouslySetInnerHTML={{ __html: globalPrism }} />
          <style dangerouslySetInnerHTML={{ __html: globalTippy }} />
          <style dangerouslySetInnerHTML={{ __html: globalExtras }} />
          <link rel="stylesheet" href="/static/libs/algolia/algolia.min.css" />
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
      </html>
    );
  }
}
