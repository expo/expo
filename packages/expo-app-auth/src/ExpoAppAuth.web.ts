export default {
  get name(): string {
    return 'ExpoAppAuth';
  },
  get OAuthRedirect(): string {
    return window.location.href;
  },
};
