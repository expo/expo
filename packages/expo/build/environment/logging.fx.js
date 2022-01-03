import Constants from 'expo-constants';
import getDevServer from 'react-native/Libraries/Core/Devtools/getDevServer';
// Metro and terser don't seem to be capable of shaking the imports unless they're wrapped in __DEV__.
if (__DEV__) {
    var ref, ref1, ref2, ref3, ref4, ref5;
    // If the app is being run outside of the Expo Go app and not using expo-dev-menu,
    // then we can attempt to polyfill the `logUrl` to enable console logging in the CLI.
    if (// If this is defined then we can be define Constants.manifest.logUrl without worrying about the warning.
    Constants.__unsafeNoWarnManifest && // Only attempt to set the URL if `Constants.__unsafeNoWarnManifest.logUrl` is not defined.
    !Constants.__unsafeNoWarnManifest.logUrl) {
        const devServerInfo = getDevServer();
        // Ensure the URL is remote and not local. i.e `file://`
        if (devServerInfo.bundleLoadedFromServer) {
            // url: `http://localhost:8081/`
            const url = !devServerInfo.url.endsWith('/') ? `${devServerInfo.url}/` : devServerInfo.url;
            // The standard Expo logUrl is `http://localhost:19000/logs`, this code assumes that the `logs` endpoint doesn't change.
            const logUrl = url + 'logs';
            Constants.__unsafeNoWarnManifest.logUrl = logUrl;
            if (Constants.manifest) {
                Constants.manifest.logUrl = logUrl;
            }
        }
    } else if (// If this is defined then we can be define Constants.manifest2.extra.expoGo.logUrl without worrying about the warning.
    Constants.__unsafeNoWarnManifest2 && // Only attempt to set the URL if `Constants.__unsafeNoWarnManifest2.logUrl` is not defined.
    !((ref = Constants.__unsafeNoWarnManifest2.extra) === null || ref === void 0 ? void 0 : (ref1 = ref.expoGo) === null || ref1 === void 0 ? void 0 : ref1.logUrl)) {
        const devServerInfo = getDevServer();
        // Ensure the URL is remote and not local. i.e `file://`
        if (devServerInfo.bundleLoadedFromServer) {
            var ref6, ref7, ref8;
            // url: `http://localhost:8081/`
            const url = !devServerInfo.url.endsWith('/') ? `${devServerInfo.url}/` : devServerInfo.url;
            // The standard Expo logUrl is `http://localhost:19000/logs`, this code assumes that the `logs` endpoint doesn't change.
            const logUrl = url + 'logs';
            if ((ref6 = Constants.__unsafeNoWarnManifest2.extra) === null || ref6 === void 0 ? void 0 : ref6.expoGo) {
                Constants.__unsafeNoWarnManifest2.extra.expoGo.logUrl = logUrl;
            }
            if ((ref7 = Constants.manifest2) === null || ref7 === void 0 ? void 0 : (ref8 = ref7.extra) === null || ref8 === void 0 ? void 0 : ref8.expoGo) {
                Constants.manifest2.extra.expoGo.logUrl = logUrl;
            }
        }
    }
    // TODO: Maybe warn that console logging will not be enabled.
    if (((ref2 = Constants.__unsafeNoWarnManifest) === null || ref2 === void 0 ? void 0 : ref2.logUrl) || ((ref3 = Constants.__unsafeNoWarnManifest2) === null || ref3 === void 0 ? void 0 : (ref4 = ref3.extra) === null || ref4 === void 0 ? void 0 : (ref5 = ref4.expoGo) === null || ref5 === void 0 ? void 0 : ref5.logUrl)) {
        // Enable logging to the Expo dev tools only if this JS is not running in a web browser (ex: the
        // remote debugger). In Expo Web we don't show console logs in the CLI, so there's no special case needed.
        if (!isRunningInWebBrowser()) {
            const Logs = require('../logs/Logs');
            Logs.enableExpoCliLogging();
        } else {
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
 */ function isRunningInWebBrowser() {
    return (navigator === null || navigator === void 0 ? void 0 : navigator.product) === 'Gecko';
}

//# sourceMappingURL=logging.fx.js.map