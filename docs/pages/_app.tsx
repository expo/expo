import { ThemeProvider } from '@expo/styleguide';
import { MDXProvider } from '@mdx-js/react';
import * as Sentry from '@sentry/browser';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';

import { TrackPageView } from '~/common/analytics';
import { preprocessSentryError } from '~/common/sentry-utilities';
import * as markdown from '~/common/translate-markdown';
import DocumentationElements from '~/components/page-higher-order/DocumentationElements';

import 'react-diff-view/style/index.css';
import '@expo/styleguide/dist/expo-theme.css';
import 'tippy.js/dist/tippy.css';
import '../public/static/libs/algolia/algolia.css';
import '../public/static/libs/algolia/algolia-mobile.css';

Sentry.init({
  dsn: 'https://67e35a01698649d5aa33aaab61777851@sentry.io/1526800',
  beforeSend: preprocessSentryError,
});

const DynamicLoadAnalytics = dynamic<{ id: string }>(() =>
  import('~/common/analytics').then(mod => mod.LoadAnalytics)
);

const markdownComponents = {
  ...markdown,
  wrapper: DocumentationElements,
};

export function reportWebVitals({ id, name, label, value }: NextWebVitalsMetric) {
  window?.gtag?.('event', name, {
    event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    event_label: id,
    // Use a non-interaction event to avoid affecting bounce rate.
    non_interaction: true,
  });
}

function App({ Component, pageProps }: AppProps) {
  const googleAnalyticsId = 'UA-107832480-3';
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false);

  useEffect(() => {
    setShouldLoadAnalytics(true);
  }, []);

  return (
    <>
      <Head>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}', { 'transport_type': 'beacon' });
              `,
          }}
        />
      </Head>
      {shouldLoadAnalytics && <DynamicLoadAnalytics id={googleAnalyticsId} />}
      <ThemeProvider>
        <MDXProvider components={markdownComponents}>
          <Component {...pageProps} />
        </MDXProvider>
      </ThemeProvider>
      <TrackPageView id={googleAnalyticsId} />
    </>
  );
}

export default App;
