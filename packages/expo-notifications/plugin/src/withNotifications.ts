import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withNotificationsAndroid } from './withNotificationsAndroid';
import { withNotificationsIOS } from './withNotificationsIOS';

const pkg = require('expo-notifications/package.json');

const withNotifications: ConfigPlugin = config => {
  config = withNotificationsAndroid(config);
  config = withNotificationsIOS(config, { mode: 'development' });
  return config;
};

export default createRunOncePlugin(withNotifications, pkg.name, pkg.version);
