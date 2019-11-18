import React from 'react';
import * as Sentry from '@sentry/browser';
import App, { Container } from 'next/app';

Sentry.init({
  dsn: 'https://67e35a01698649d5aa33aaab61777851@sentry.io/1526800',
  beforeSend(event) {
    let message = getMessage(event);

    // If we don't know about this particular type of event then just pass it along
    if (!message) {
      return event;
    }

    // Discard any errors that we know we do not care about
    if (ERRORS_TO_DISCARD.includes(message)) {
      return null;
    }

    // Only attempt to check against cached reported messages if we have localStorage
    if (window.localStorage) {
      // Clear the saved error messages every day
      maybeResetReportedErrorsCache();

      // Bail out if we have reported the error already
      if (userHasReportedErrorMessage(message)) {
        return null;
      }

      saveReportedErrorMessage(message);
    }

    return event;
  },
});

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <Container>
        <Component {...pageProps} />
      </Container>
    );
  }
}

/*
 * Error logging filtering - prevent users from submitting errors we do not care about,
 * eg: specific error messages that are caused by extensions or other scripts
 * out of our control, or the same error being reported many times.
 */

// These exact error messages may be different depending on the browser!
const ERRORS_TO_DISCARD = [
  // This error only appears in Safari
  "undefined is not an object (evaluating 'window.__pad.performLoop')",
];

const REPORTED_ERRORS_KEY = 'sentry:reportedErrors';
const TIMESTAMP_KEY = 'sentry:errorReportingInit';
const ONE_DAY_MS = 60 * 60 * 24 * 1000;

// Extract a stable event error message out of the Sentry event object
function getMessage(event) {
  if (event.message) {
    return event.message;
  }

  if (event.exception && event.exception.values) {
    let value = event.exception.values[0].value;
    if (value) {
      return value;
    }
  }

  return null;
}

function maybeResetReportedErrorsCache() {
  let timestamp = localStorage.getItem(TIMESTAMP_KEY);
  let now = new Date().getTime();

  if (!timestamp) {
    localStorage.setItem(TIMESTAMP_KEY, new Date().getTime());
  } else if (now - timestamp >= ONE_DAY_MS) {
    localStorage.removeItem(REPORTED_ERRORS_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
  }
}

function userHasReportedErrorMessage(message) {
  let messages = getReportedErrorMessages();
  if (messages.includes(message)) {
    return true;
  } else {
    return false;
  }
}

function saveReportedErrorMessage(message) {
  let messages = getReportedErrorMessages();
  localStorage.setItem(REPORTED_ERRORS_KEY, JSON.stringify([...messages, message]));
}

function getReportedErrorMessages() {
  let messages = localStorage.getItem(REPORTED_ERRORS_KEY);
  if (!messages) {
    return [];
  }

  return JSON.parse(messages);
}
