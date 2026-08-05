import { NotificationsPluginProps as Props } from './withNotifications';

export default (props: Props = {}): [string, Props] => ['expo-notifications', props];
