import { Event } from '@sentry/types';
/*
 * Error logging filtering - prevent users from submitting errors we do not care about,
 * eg: specific error messages that are caused by extensions or other scripts
 * out of our control, or the same error being reported many times.
 */

// These exact error messages may be different depending on the browser!
const ERRORS_TO_DISCARD = [
  // Filter out errors from extensions
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  // This error only appears in Safari
  "undefined is not an object (evaluating 'window.__pad.performLoop')",
  // This error appears in Firefox related to local storage and flooded our Sentry bandwidth
  'SecurityError: The operation is insecure.',
];

const REPORTED_ERRORS_KEY = 'sentry:reportedErrors';
const TIMESTAMP_KEY = 'sentry:errorReportingInit';
const ONE_DAY_MS = 60 * 60 * 24 * 1000;

export function preprocessSentryError(event: Event) {
  const message = getMessage(event);

  // If we don't know about this particular type of event then just pass it along
  if (!message) {
    return event;
  }

  // Discard any errors that we know we do not care about
  if (ERRORS_TO_DISCARD.includes(message)) {
    return null;
  }

  // Only attempt to check against cached reported messages if we have localStorage
  if (isLocalStorageAvailable()) {
    // Clear the saved error messages every day
    maybeResetReportedErrorsCache();

    // Bail out if we have reported the error already
    if (userHasReportedErrorMessage(message)) {
      return null;
    }

    saveReportedErrorMessage(message);
  }

  return event;
}

// https://gist.github.com/paulirish/5558557
function isLocalStorageAvailable(): boolean {
  try {
    if (!window.localStorage) {
      return false;
    }

    localStorage.setItem('localStorage:test', 'value');
    localStorage.removeItem('localStorage:test');
    return true;
  } catch {
    return false;
  }
}

// Extract a stable event error message out of the Sentry event object
function getMessage(event: Event) {
  if (event.message) {
    return event.message;
  }

  if (event.exception && event.exception.values) {
    const value = event.exception.values[0].value;
    if (value) {
      return value;
    }
  }

  return null;
}

function maybeResetReportedErrorsCache() {
  const timestamp = parseInt(localStorage.getItem(TIMESTAMP_KEY) || '', 10);
  const now = new Date().getTime();

  if (!timestamp) {
    localStorage.setItem(TIMESTAMP_KEY, new Date().getTime().toString());
  } else if (now - timestamp >= ONE_DAY_MS) {
    localStorage.removeItem(REPORTED_ERRORS_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
  }
}

function userHasReportedErrorMessage(message: string) {
  const messages = getReportedErrorMessages();
  if (messages.includes(message)) {
    return true;
  } else {
    return false;
  }
}

function saveReportedErrorMessage(message: string) {
  const messages = getReportedErrorMessages();
  localStorage.setItem(REPORTED_ERRORS_KEY, JSON.stringify([...messages, message]));
}

function getReportedErrorMessages(): string[] {
  const messages = localStorage.getItem(REPORTED_ERRORS_KEY);
  if (!messages) {
    return [];
  }

  return JSON.parse(messages);
}
