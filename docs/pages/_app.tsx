import { ThemeProvider } from '@expo/styleguide';
import * as Sentry from '@sentry/browser';
import { AppProps } from 'next/app';
import React from 'react';

import { preprocessSentryError } from '~/common/sentry-utilities';
import { useNProgress } from '~/common/use-nprogress';
import { AnalyticsProvider } from '~/providers/Analytics';
import { MarkdownProvider } from '~/providers/Markdown';

import 'react-diff-view/style/index.css';
import '@expo/styleguide/dist/expo-theme.css';
import 'tippy.js/dist/tippy.css';
import '../public/static/libs/algolia/algolia.css';
import '../public/static/libs/algolia/algolia-mobile.css';

Sentry.init({
  dsn: 'https://67e35a01698649d5aa33aaab61777851@sentry.io/1526800',
  beforeSend: preprocessSentryError,
});

export { reportWebVitals } from '~/providers/Analytics';

export default function App({ Component, pageProps }: AppProps) {
  useNProgress();
  return (
    <AnalyticsProvider>
      <ThemeProvider>
        <MarkdownProvider>
          <Component {...pageProps} />
        </MarkdownProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}
