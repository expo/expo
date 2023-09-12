export default function loadServiceWorker() {
    if (!window) {
        return;
    }
    if (!('serviceWorker' in navigator)) {
        return;
    }
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then(() => {
            console.log('Service worker registered!');
        })
            .catch((error) => {
            console.warn('Error registering service worker:');
            console.warn(error);
        });
    });
}
//# sourceMappingURL=loadServiceWorker.js.map