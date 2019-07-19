import invariant from 'invariant';
const EventTypes = ['url'];
const listeners = [];
function _validateURL(url) {
    invariant(typeof url === 'string', `Invalid URL: should be a string. Instead found: ${url}`);
    invariant(url, 'Invalid URL: cannot be empty');
}
// TODO: Bacon: For better parity this should extend EventEmitter like React Native.
class Linking {
    addEventListener(type, listener) {
        invariant(EventTypes.indexOf(type) !== -1, `Linking.addEventListener(): ${type} is not a valid event`);
        const nativeListener = nativeEvent => listener({ url: window.location.href, nativeEvent });
        listeners.push({ listener, nativeListener });
        window.addEventListener('message', nativeListener, false);
    }
    removeEventListener(type, listener) {
        invariant(EventTypes.indexOf(type) !== -1, `Linking.removeEventListener(): ${type} is not a valid event.`);
        const listenerIndex = listeners.findIndex(pair => pair.listener === listener);
        invariant(listenerIndex !== -1, 'Linking.removeEventListener(): cannot remove an unregistered event listener.');
        const nativeListener = listeners[listenerIndex].nativeListener;
        window.removeEventListener('message', nativeListener, false);
        listeners.splice(listenerIndex, 1);
    }
    async canOpenURL(url) {
        _validateURL(url);
        return true;
    }
    async getInitialURL() {
        return window.location.href;
    }
    async openURL(url) {
        _validateURL(url);
        window.location.href = url;
    }
}
export default new Linking();
//# sourceMappingURL=LinkingModule.web.js.map