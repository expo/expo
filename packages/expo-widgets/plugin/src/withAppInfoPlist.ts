import { ConfigPlugin, withInfoPlist } from 'expo/config-plugins';

interface withAppInfoPlistProps {
  frequentUpdates?: boolean;
  groupIdentifier: string;
}

const withAppInfoPlist: ConfigPlugin<withAppInfoPlistProps> = (
  config,
  { frequentUpdates, groupIdentifier }
) =>
  withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    infoPlist.NSSupportsLiveActivities = true;
    infoPlist.NSSupportsLiveActivitiesFrequentUpdates = frequentUpdates ?? false;
    infoPlist.ExpoWidgetsAppGroupIdentifier = groupIdentifier;
    return config;
  });

export default withAppInfoPlist;
