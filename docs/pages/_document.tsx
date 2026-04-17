import { THEME_COOKIE_NAME } from '@expo/styleguide';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

const BLOCKING_THEME_SCRIPT = `
(function() {
  function getCookieTheme() {
    var match = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]*)/);
    var val = match && match[1];
    return val === 'dark' || val === 'light' ? val : null;
  }
  var theme = getCookieTheme();
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
})();
`;

export default class DocsDocument extends Document {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: <>{initialProps.styles}</>,
    };
  }

  render() {
    return (
      <Html lang="en" data-expo-theme>
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
