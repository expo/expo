import { THEME_COOKIE_NAME } from '@expo/styleguide';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

import { getLocaleFromPath, type SupportedLocale } from '~/common/i18n';

const BLOCKING_THEME_SCRIPT = `
(function() {
  function getCookieTheme() {
    var match = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]*)/);
    var val = match && match[1];
    return val === 'dark' || val === 'light' ? val : null;
  }
  var theme = getCookieTheme();
  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark-theme', isDark);
  document.documentElement.classList.toggle('light-theme', !isDark);
})();
`;

type DocsDocumentProps = {
  locale: SupportedLocale;
};

export default class DocsDocument extends Document<DocsDocumentProps> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    const locale = getLocaleFromPath(ctx.pathname || '');
    return {
      ...initialProps,
      locale,
      styles: <>{initialProps.styles}</>,
    };
  }

  render() {
    return (
      <Html lang={this.props.locale} data-expo-theme>
        <Head>
          <script dangerouslySetInnerHTML={{ __html: BLOCKING_THEME_SCRIPT }} />
        </Head>
        <body className="text-pretty">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
