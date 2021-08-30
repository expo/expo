import WebUnsupportedError from './WebUnsupportedError';

export function disableErrorHandling() {
  throw new WebUnsupportedError();
}
