import { emitNotification } from './Notifications';
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        emitNotification(event.data);
    });
}
//# sourceMappingURL=ExponentNotifications.fx.web.js.map