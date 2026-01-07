import { ConfigPlugin } from 'expo/config-plugins';
interface LiveActivitiesProps {
    frequentUpdates?: boolean;
}
declare const withLiveActivities: ConfigPlugin<LiveActivitiesProps>;
export default withLiveActivities;
