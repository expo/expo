export const FEEDBACK_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://api.expo.test/v2/feedback/docs-send'
    : 'https://api.expo.dev/v2/feedback/docs-send';
