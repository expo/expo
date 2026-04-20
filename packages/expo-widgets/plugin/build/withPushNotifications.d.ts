import { ConfigPlugin } from 'expo/config-plugins';
type PushNotificationProps = {
    enablePushNotifications: boolean;
};
declare const withPushNotifications: ConfigPlugin<PushNotificationProps>;
export default withPushNotifications;
