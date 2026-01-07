import { ConfigPlugin } from 'expo/config-plugins';
interface PushNotificationProps {
    enablePushNotifications: boolean;
}
declare const withPushNotifications: ConfigPlugin<PushNotificationProps>;
export default withPushNotifications;
