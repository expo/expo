import { Constants } from 'expo-constants';

import Logs from '../logs/Logs';
import RemoteLogging from '../logs/RemoteLogging';

if (Constants.manifest && Constants.manifest.logUrl) {
  // Enable logging to the Expo dev tools only if this JS is not running in a web browser (ex: the
  // remote debugger)
  if (!navigator.hasOwnProperty('userAgent')) {
    Logs.enableExpoCliLogging();
  } else {
    RemoteLogging.enqueueRemoteLogAsync('info', {}, [
      'You are now debugging remotely; check your browser console for your application logs.',
    ]);
  }
}

// NOTE(2018-10-29): temporarily filter out cyclic dependency warnings here since they are noisy and
// each warning symbolicates a stack trace, which is slow when there are many warnings
const originalWarn = console.warn;
console.warn = function warn(...args) {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    /^Require cycle: .*\/node_modules\//.test(args[0])
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
