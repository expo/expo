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
import { TutorialChapterCompletionProvider } from '~/providers/TutorialChapterCompletionProvider';
import { markdownComponents } from '~/ui/components/Markdown';
import * as Tooltip from '~/ui/components/Tooltip';

import '~/styles/global.css';
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
  denyUrls: [
    /https:\/\/docs-expo-dev\.translate\.goog/,
    /https:\/\/translated\.turbopages\.org/,
    /https:\/\/docs\.expo\.dev\/index\.html/,
    /https:\/\/expo\.nodejs\.cn/,
  ],
  integrations: [Sentry.browserTracingIntegration(), Sentry.extraErrorDataIntegration()],
  tracesSampleRate: 0.002,
  replaysSessionSampleRate: 0.0001,
  replaysOnErrorSampleRate: 0.05,
});

import('@sentry/react').then(lazyLoadedSentry => {
  Sentry.addIntegration(lazyLoadedSentry.replayIntegration());
});

const rootMarkdownComponents = {
  ...markdownComponents,
  wrapper: DocumentationElements,
};

export { reportWebVitals } from '~/providers/Analytics';

export default function App({ Component, pageProps }: AppProps) {
  useNProgress();
  return (
    <>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        html,
        body,
        kbd,
        button,
        input,
        select,
        tspan,
        text {
          font-family: ${regularFont.style.fontFamily}, sans-serif;
        }
        code,
        pre,
        table.diff {
          font-family: ${monospaceFont.style.fontFamily}, monospace;
        }
      `}</style>
      <AnalyticsProvider>
        <ThemeProvider>
          <TutorialChapterCompletionProvider>
            <CodeBlockSettingsProvider>
              <MDXProvider components={rootMarkdownComponents}>
                <Tooltip.Provider>
                  <Component {...pageProps} />
                </Tooltip.Provider>
              </MDXProvider>
            </CodeBlockSettingsProvider>
          </TutorialChapterCompletionProvider>
        </ThemeProvider>
      </AnalyticsProvider>
    </>
  );
}
