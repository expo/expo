import { css, Global } from '@emotion/react';
import { ThemeProvider } from '@expo/styleguide';
import { MDXProvider } from '@mdx-js/react';
import * as Sentry from '@sentry/react';
import { AppProps } from 'next/app';
import { Inter, Fira_Code } from 'next/font/google';

import { preprocessSentryError } from '~/common/sentry-utilities';
import { useNProgress } from '~/common/use-nprogress';
import DocumentationElements from '~/components/page-higher-order/DocumentationElements';
import { AnalyticsProvider } from '~/providers/Analytics';
import { CodeBlockSettingsProvider } from '~/providers/CodeBlockSettingsProvider';
import { markdownComponents } from '~/ui/components/Markdown';
import * as Tooltip from '~/ui/components/Tooltip';

import 'global-styles/global.css';
import '@expo/styleguide/dist/expo-theme.css';
import '@expo/styleguide-search-ui/dist/expo-search-ui.css';
import 'tippy.js/dist/tippy.css';

const isDev = process.env.NODE_ENV === 'development';

export const regularFont = Inter({
  display: 'swap',
  subsets: ['latin'],
});
export const monospaceFont = Fira_Code({
  weight: ['400', '500'],
  display: 'swap',
  subsets: ['latin'],
});

Sentry.init({
  dsn: 'https://1a2f5c8cec574bcea3971b74f91504d6@o30871.ingest.sentry.io/1526800',
  beforeSend: preprocessSentryError,
  environment: isDev ? 'development' : 'production',
  denyUrls: isDev
    ? undefined
    : [
        /https:\/\/docs-expo-dev\.translate\.goog/,
        /https:\/\/translated\.turbopages\.org/,
        /https:\/\/docs\.expo\.dev\/index\.html/,
        /https:\/\/expo\.nodejs\.cn/,
      ],
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.001,
});

const rootMarkdownComponents = {
  ...markdownComponents,
  wrapper: DocumentationElements,
};

export { reportWebVitals } from '~/providers/Analytics';

export default function App({ Component, pageProps }: AppProps) {
  useNProgress();
  return (
    <AnalyticsProvider>
      <ThemeProvider>
        <CodeBlockSettingsProvider>
          <MDXProvider components={rootMarkdownComponents}>
            <Tooltip.Provider>
              <Global
                styles={css({
                  'html, body, kbd, button, input, select': {
                    fontFamily: regularFont.style.fontFamily,
                  },
                  'code, pre, table.diff': {
                    fontFamily: monospaceFont.style.fontFamily,
                  },
                })}
              />
              <Component {...pageProps} />
            </Tooltip.Provider>
          </MDXProvider>
        </CodeBlockSettingsProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}
