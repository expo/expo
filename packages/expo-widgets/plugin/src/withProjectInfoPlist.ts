import { ConfigPlugin, withInfoPlist } from 'expo/config-plugins';

interface LiveActivitiesProps {
  frequentUpdates?: boolean;
}

const withLiveActivities: ConfigPlugin<LiveActivitiesProps> = (config, { frequentUpdates }) =>
  withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    infoPlist.NSSupportsLiveActivities = true;
    infoPlist.NSSupportsLiveActivitiesFrequentUpdates = frequentUpdates ?? false;
    return config;
  });

export default withLiveActivities;
