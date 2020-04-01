import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
export default {
  get name(): string {
    return 'ExpoAppAuth';
  },
  get OAuthRedirect(): string {
    return canUseDOM ? window.location.href : '';
  },
};
