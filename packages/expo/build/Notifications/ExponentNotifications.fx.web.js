import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import { getExponentPushTokenAsync } from './ExponentNotificationsHelper.web';
import { emitNotification } from './Notifications';
if (canUseDOM && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        emitNotification(event.data);
    });
    navigator.serviceWorker.addEventListener('pushsubscriptionchange', async (event) => {
        // Updates Expo token with new device token.
        await getExponentPushTokenAsync();
    });
}
//# sourceMappingURL=ExponentNotifications.fx.web.js.map