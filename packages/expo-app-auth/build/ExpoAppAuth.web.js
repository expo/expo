import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
export default {
    get name() {
        return 'ExpoAppAuth';
    },
    get OAuthRedirect() {
        return canUseDOM ? window.location.href : '';
    },
};
//# sourceMappingURL=ExpoAppAuth.web.js.map