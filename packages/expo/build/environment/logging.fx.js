import Constants from 'expo-constants';
import * as Logs from '../logs/Logs';
import RemoteLogging from '../logs/RemoteLogging';
if (Constants.manifest && Constants.manifest.logUrl) {
    // Enable logging to the Expo dev tools only if this JS is not running in a web browser (ex: the
    // remote debugger)
    if (!navigator.hasOwnProperty('userAgent')) {
        Logs.enableExpoCliLogging();
    }
    else {
        RemoteLogging.enqueueRemoteLogAsync('info', {}, [
            'You are now debugging remotely; check your browser console for your application logs.',
        ]);
    }
}
//# sourceMappingURL=logging.fx.js.map