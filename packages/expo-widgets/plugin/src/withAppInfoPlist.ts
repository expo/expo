import { ConfigPlugin } from 'expo/config-plugins';

import withInfoPlistValues from './withInfoPlistValues';

type withAppInfoPlistProps = {
  frequentUpdates: boolean;
  groupIdentifier: string;
};

const withAppInfoPlist: ConfigPlugin<withAppInfoPlistProps> = (
  config,
  { frequentUpdates, groupIdentifier }
) => {
  return withInfoPlistValues(config, {
    NSSupportsLiveActivities: true,
    NSSupportsLiveActivitiesFrequentUpdates: frequentUpdates,
    ExpoWidgetsAppGroupIdentifier: groupIdentifier,
  });
};

export default withAppInfoPlist;
