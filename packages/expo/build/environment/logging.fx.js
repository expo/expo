import Constants from 'expo-constants';
// Metro and terser don't seem to be capable of shaking the imports unless they're wrapped in __DEV__.
if (__DEV__) {
    if (Constants.__unsafeNoWarnManifest?.logUrl) {
        // Enable logging to the Expo dev tools only if this JS is not running in a web browser (ex: the
        // remote debugger). In Expo Web we don't show console logs in the CLI, so there's no special case needed.
        if (!isRunningInWebBrowser()) {
            const Logs = require('../logs/Logs');
            Logs.enableExpoCliLogging();
        }
        else {
            const RemoteLogging = require('../logs/RemoteLogging').default;
            RemoteLogging.enqueueRemoteLogAsync('info', {}, [
                'You are now debugging remotely; check your browser console for your application logs.',
            ]);
        }
    }
}
/**
 * In all web browsers navigator.product is "Gecko" for compatibility reasons.
 * See https://developer.mozilla.org/en-US/docs/Web/API/NavigatorID/product
 * and the discussion at https://github.com/expo/expo/pull/8807#discussion_r441391148.
 */
function isRunningInWebBrowser() {
    return navigator?.product === 'Gecko';
}
//# sourceMappingURL=logging.fx.js.map