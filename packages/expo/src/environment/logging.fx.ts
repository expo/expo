import Constants from 'expo-constants';

import * as Logs from '../logs/Logs';
import RemoteLogging from '../logs/RemoteLogging';

if (Constants.manifest && Constants.manifest.logUrl) {
  // Enable logging to the Expo dev tools only if this JS is not running in a web browser (ex: the
  // remote debugger). In Expo Web we don't show console logs in the CLI, so there's no special case needed.
  if (!isRunningInWebBrowser()) {
    Logs.enableExpoCliLogging();
  } else {
    RemoteLogging.enqueueRemoteLogAsync('info', {}, [
      'You are now debugging remotely; check your browser console for your application logs.',
    ]);
  }
}

/**
 * In web browsers the `atob` function is defined, as per https://stackoverflow.com/a/42839384/1123156.
 */
function isRunningInWebBrowser() {
  return typeof atob !== 'undefined';
}
