import { ThemeProvider } from '@expo/styleguide';
import { MDXProvider } from '@mdx-js/react';
import * as Sentry from '@sentry/react';
import { Slot } from 'expo-router';
import { MotionConfig } from 'framer-motion';
import { IntlProvider } from 'react-intl';

import { getLocaleFromPath, messages } from '~/common/i18n';
import { preprocessSentryError } from '~/common/sentry-utilities';
import { useNProgress } from '~/common/useNProgress';
import { DocumentationPageWrapper } from '~/components/DocumentationPageWrapper';
import { buildWebsiteSchema } from '~/constants/structured-data';
import { useAnalyticsPageTracking } from '~/providers/Analytics';
import { CodeBlockSettingsProvider } from '~/providers/CodeBlockSettingsProvider';
import { CometlyPixel } from '~/providers/CometlyPixel';
import { ConsentProvider } from '~/providers/ConsentProvider';
import { TutorialChapterCompletionProvider } from '~/providers/TutorialChapterCompletionProvider';
import { HreflangAlternates } from '~/ui/components/HreflangAlternates';
import { markdownComponents } from '~/ui/components/Markdown';
import { CodeSelectionCopy } from '~/ui/components/Snippet/CodeSelectionCopy';
import { StructuredData } from '~/ui/components/StructuredData';
import * as Tooltip from '~/ui/components/Tooltip';

import { FontFaces } from '../fonts';
import { RouteChangeEvents, useRouter } from '../next-compat/router';

// The order is the same as in the Next.js CSS file: theme, search, website, then the rules
// that `../docs/pages/_app.tsx` adds with styled-jsx.
import '@expo/styleguide/dist/expo-theme.css';
import '@expo/styleguide-search-ui/dist/expo-search-ui.css';

import '~/styles/global.css';

import '../compat.css';

const isDev = process.env.NODE_ENV === 'development';

if (typeof window !== 'undefined') {
  // Next.js sets `process.browser`. The website source reads it.
  (process as any).browser = true;

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
    tracesSampleRate: 0.00001,
    replaysSessionSampleRate: 0.000005,
    replaysOnErrorSampleRate: 0.002,
  });

  import('@sentry/react').then(lazyLoadedSentry => {
    Sentry.addIntegration(lazyLoadedSentry.replayIntegration());
  });
}

const rootMarkdownComponents = {
  ...markdownComponents,
  wrapper: DocumentationPageWrapper,
};

export default function RootLayout() {
  const router = useRouter();
  const locale = getLocaleFromPath(router.asPath);
  useNProgress();
  useAnalyticsPageTracking();
  return (
    <div id="__next">
      <FontFaces />
      <RouteChangeEvents />
      <StructuredData id="website" data={buildWebsiteSchema(locale)} />
      <HreflangAlternates />
      <IntlProvider locale={locale} messages={messages[locale]} defaultLocale="en">
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <ConsentProvider>
              <CometlyPixel />
              <TutorialChapterCompletionProvider>
                <CodeBlockSettingsProvider>
                  <MDXProvider components={rootMarkdownComponents as any}>
                    <Tooltip.Provider>
                      <Slot />
                      <CodeSelectionCopy />
                    </Tooltip.Provider>
                  </MDXProvider>
                </CodeBlockSettingsProvider>
              </TutorialChapterCompletionProvider>
            </ConsentProvider>
          </ThemeProvider>
        </MotionConfig>
      </IntlProvider>
    </div>
  );
}
