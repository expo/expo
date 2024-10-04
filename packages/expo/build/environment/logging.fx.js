import Constants from 'expo-constants';
import { Platform } from 'expo-modules-core';
import getDevServer from 'react-native/Libraries/Core/Devtools/getDevServer';
// Metro and terser don't seem to be capable of shaking the imports unless they're wrapped in __DEV__.
if (__DEV__) {
    // If the app is being run outside of the Expo Go app and not using expo-dev-menu,
    // then we can attempt to polyfill the `logUrl` to enable console logging in the CLI.
    if (
    // If this is defined then we can be define Constants.manifest.logUrl without worrying about the warning.
    Constants.__unsafeNoWarnManifest &&
        // Only attempt to set the URL if `Constants.__unsafeNoWarnManifest.logUrl` is not defined.
        !Constants.__unsafeNoWarnManifest.logUrl) {
        const devServerInfo = getDevServer();
        // Ensure the URL is remote and not local. i.e `file://`
        if (devServerInfo.bundleLoadedFromServer) {
            // url: `http://localhost:8081/`
            const url = !devServerInfo.url.endsWith('/') ? `${devServerInfo.url}/` : devServerInfo.url;
            // The standard Expo logUrl is `http://localhost:8081/logs`, this code assumes that the `logs` endpoint doesn't change.
            const logUrl = url + 'logs';
            Constants.__unsafeNoWarnManifest.logUrl = logUrl;
            if (Constants.expoGoConfig) {
                Constants.expoGoConfig.logUrl = logUrl;
            }
        }
    }
    else if (
    // If this is defined then we can be define Constants.manifest2.extra.expoGo.logUrl without worrying about the warning.
    Constants.__unsafeNoWarnManifest2 &&
        // Only attempt to set the URL if `Constants.__unsafeNoWarnManifest2.logUrl` is not defined.
        !Constants.__unsafeNoWarnManifest2.extra?.expoGo?.logUrl) {
        const devServerInfo = getDevServer();
        // Ensure the URL is remote and not local. i.e `file://`
        if (devServerInfo.bundleLoadedFromServer) {
            // url: `http://localhost:8081/`
            const url = !devServerInfo.url.endsWith('/') ? `${devServerInfo.url}/` : devServerInfo.url;
            // The standard Expo logUrl is `http://localhost:8081/logs`, this code assumes that the `logs` endpoint doesn't change.
            const logUrl = url + 'logs';
            if (Constants.__unsafeNoWarnManifest2.extra?.expoGo) {
                Constants.__unsafeNoWarnManifest2.extra.expoGo.logUrl = logUrl;
            }
            if (Constants.manifest2?.extra?.expoGo) {
                Constants.manifest2.extra.expoGo.logUrl = logUrl;
            }
        }
    }
    // TODO: Maybe warn that console logging will not be enabled.
    if (Constants.__unsafeNoWarnManifest?.logUrl ||
        Constants.__unsafeNoWarnManifest2?.extra?.expoGo?.logUrl) {
        // Enable logging to the Expo dev tools only if this JS is not running in a web browser (ex: the
        // remote debugger). In Expo Web we don't show console logs in the CLI, so there's no special case needed.
        if (Platform.isAsyncDebugging) {
            const RemoteLogging = require('../logs/RemoteLogging').default;
            RemoteLogging.enqueueRemoteLogAsync('info', {}, [
                'You are now debugging remotely; check your browser console for your application logs.',
            ]);
        }
        else {
            const Logs = require('../logs/Logs');
            Logs.enableExpoCliLogging();
        }
    }
}
//# sourceMappingURL=logging.fx.js.map