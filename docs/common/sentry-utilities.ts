import { ErrorEvent } from '@sentry/react';
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
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const HALF_HOUR_MS = 0.5 * 60 * 60 * 1000;

export function preprocessSentryError(event: ErrorEvent) {
  const message = getMessage(event);

  // Check if it's rate limited to avoid sending the same error over and over
  if (isRateLimited(message || 'empty')) {
    return null;
  }

  // If we don't know about this particular type of event then just pass it along
  if (!message) {
    return event;
  }

  // Discard any errors that we know we do not care about
  if (ERRORS_TO_DISCARD.includes(message)) {
    return null;
  }

  // Only attempt to check against cached reported messages if we have localStorage
  try {
    if (isLocalStorageAvailable()) {
      // Clear the saved error messages every day
      maybeResetReportedErrorsCache();

      // Bail out if we have reported the error already
      if (userHasReportedErrorMessage(message)) {
        return null;
      }

      saveReportedErrorMessage(message);
    }
  } catch {
    // Ignore the local storage exceptions
    return event;
  }

  return event;
}

// https://gist.github.com/paulirish/5558557
export function isLocalStorageAvailable(): boolean {
  try {
    if (!window.localStorage || localStorage === null || typeof localStorage === 'undefined') {
      return false;
    }

    localStorage.setItem('localStorage:test', 'value');
    if (localStorage.getItem('localStorage:test') !== 'value') {
      return false;
    }
    localStorage.removeItem('localStorage:test');
    return true;
  } catch {
    return false;
  }
}

// https://github.com/getsentry/sentry-javascript/issues/435
const rateLimiter: Record<string, number> = {};
function isRateLimited(message: string) {
  if (rateLimiter[message] && rateLimiter[message] > Date.now()) {
    return true;
  }

  rateLimiter[message] = Date.now() + HALF_HOUR_MS;
  return false;
}

// Extract a stable event error message out of the Sentry event object
function getMessage(event: ErrorEvent) {
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
  return messages.includes(message);
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
