import { THEME_COOKIE_NAME } from '@expo/styleguide';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

import { getLocaleFromPath, type SupportedLocale } from '~/common/i18n';
import {
  DEFAULT_PACKAGE_MANAGER,
  PACKAGE_MANAGER_ORDER,
  PACKAGE_MANAGER_STORAGE_KEY,
} from '~/ui/components/Snippet/blocks/packageManagerStore';

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

const BLOCKING_PACKAGE_MANAGER_SCRIPT = `
(function() {
  var managers = ${JSON.stringify(PACKAGE_MANAGER_ORDER)};
  var stored = null;
  try {
    stored = window.localStorage.getItem('${PACKAGE_MANAGER_STORAGE_KEY}');
  } catch (error) {}
  var active = managers.indexOf(stored) === -1 ? '${DEFAULT_PACKAGE_MANAGER}' : stored;
  document.documentElement.classList.add('pm-' + active);
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
          <script dangerouslySetInnerHTML={{ __html: BLOCKING_PACKAGE_MANAGER_SCRIPT }} />
        </Head>
        <body className="text-pretty">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
