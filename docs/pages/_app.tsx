import { ThemeProvider } from '@expo/styleguide';
import { MDXProvider } from '@mdx-js/react';
import * as Sentry from '@sentry/browser';
import { AppProps } from 'next/app';
import React from 'react';

import { preprocessSentryError } from '~/common/sentry-utilities';
import * as markdownComponents from '~/common/translate-markdown';
import { useNProgress } from '~/common/use-nprogress';
import DocumentationElements from '~/components/page-higher-order/DocumentationElements';
import { AnalyticsProvider } from '~/providers/Analytics';

import 'react-diff-view/style/index.css';
import '@expo/styleguide/dist/expo-theme.css';
import 'tippy.js/dist/tippy.css';
import '../public/static/libs/algolia/algolia.css';
import '../public/static/libs/algolia/algolia-mobile.css';

Sentry.init({
  dsn: 'https://67e35a01698649d5aa33aaab61777851@sentry.io/1526800',
  beforeSend: preprocessSentryError,
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
        <MDXProvider components={rootMarkdownComponents}>
          <Component {...pageProps} />
        </MDXProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}
