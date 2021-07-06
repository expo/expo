import { Platform } from '@unimodules/core';
import invariant from 'invariant';
const EventTypes = ['url'];
const listeners = [];
export default {
    addEventListener(type, listener) {
        invariant(EventTypes.indexOf(type) !== -1, `Linking.addEventListener(): ${type} is not a valid event`);
        const nativeListener = nativeEvent => listener({ url: window.location.href, nativeEvent });
        listeners.push({ listener, nativeListener });
        window.addEventListener('message', nativeListener, false);
    },
    removeEventListener(type, listener) {
        invariant(EventTypes.indexOf(type) !== -1, `Linking.removeEventListener(): ${type} is not a valid event.`);
        const listenerIndex = listeners.findIndex(pair => pair.listener === listener);
        invariant(listenerIndex !== -1, 'Linking.removeEventListener(): cannot remove an unregistered event listener.');
        const nativeListener = listeners[listenerIndex].nativeListener;
        window.removeEventListener('message', nativeListener, false);
        listeners.splice(listenerIndex, 1);
    },
    async canOpenURL(url) {
        // In reality this should be able to return false for links like `chrome://` on chrome.
        return true;
    },
    async getInitialURL() {
        if (!Platform.isDOMAvailable)
            return '';
        return window.location.href;
    },
    async openURL(url) {
        if (Platform.isDOMAvailable) {
            // @ts-ignore
            window.location = new URL(url, window.location).toString();
        }
    },
};
//# sourceMappingURL=ExpoLinking.web.js.map