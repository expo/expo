/// <reference types="google.analytics" />

import { ThemeProvider } from '@expo/styleguide';
import * as Sentry from '@sentry/browser';
import App from 'next/app';
import React from 'react';

import { preprocessSentryError } from '~/common/sentry-utilities';
import 'react-diff-view/style/index.css';
import '@expo/styleguide/dist/expo-colors.css';
import 'tippy.js/dist/tippy.css';
import '../public/static/libs/algolia/algolia.css';
import '../public/static/libs/algolia/algolia-mobile.css';

Sentry.init({
  dsn: 'https://67e35a01698649d5aa33aaab61777851@sentry.io/1526800',
  beforeSend: preprocessSentryError,
});

export function reportWebVitals({
  id,
  name,
  label,
  value,
}: {
  id: string;
  name: string;
  label: string;
  value: number;
}) {
  window?.ga?.('send', 'event', {
    eventCategory: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    eventAction: name,
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    eventLabel: id,
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    eventValue: Math.round(name === 'CLS' ? value * 1000 : value),
    // Use a non-interaction event to avoid affecting bounce rate.
    nonInteraction: true,
    // Use `sendBeacon()` if the browser supports it.
    transport: 'beacon',
  });
}

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}
