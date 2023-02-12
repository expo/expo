import { lightTheme } from '@expo/styleguide-native';

import Statuses from './Statuses';

export default {
  [Statuses.Running]: lightTheme.status.default,
  [Statuses.Passed]: lightTheme.status.success,
  [Statuses.Failed]: lightTheme.status.error,
  [Statuses.Disabled]: lightTheme.status.warning,
  tintColor: lightTheme.status.info, // Expo Blue
  activeTintColor: lightTheme.button.primary.background,
  inactiveTintColor: lightTheme.button.secondary.background,
};
