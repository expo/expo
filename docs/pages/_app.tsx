import * as Sentry from '@sentry/browser';
import App from 'next/app';
import React from 'react';

import { preprocessSentryError } from '~/common/sentry-utilities';
import 'react-diff-view/style/index.css';

Sentry.init({
  dsn: 'https://67e35a01698649d5aa33aaab61777851@sentry.io/1526800',
  beforeSend: preprocessSentryError,
});

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return <Component {...pageProps} />;
  }
}
