// @flow

import { Constants } from 'expo-constants';

import Logs from '../logs/Logs';
import RemoteLogging from '../logs/RemoteLogging';

if (Constants.manifest && Constants.manifest.logUrl) {
  // Checks if the app is running in Chrome. If it is, we do not enable XDE and display a message on the XDE.
  if (!navigator.userAgent) {
    Logs.enableXDELogging();
  } else {
    RemoteLogging.enqueueRemoteLogAsync('info', {}, [
      'You are now debugging remotely; check your browser console for your application logs.',
    ]);
  }
}
