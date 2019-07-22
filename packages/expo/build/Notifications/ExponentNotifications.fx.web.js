import { emitNotification } from './Notifications';
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.addEventListener('message', event => {
            emitNotification(event.data);
        });
    });
}
//# sourceMappingURL=ExponentNotifications.fx.web.js.map