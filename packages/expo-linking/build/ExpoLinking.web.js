import invariant from 'invariant';
export default {
    addListener(eventName, listener) {
        invariant(eventName === 'onURLReceived', `Linking.addListener(): ${eventName} is not a valid event`);
        // Do nothing in Node.js environments
        if (typeof window === 'undefined') {
            return { remove() { } };
        }
        const nativeListener = (nativeEvent) => listener({ url: window.location.href, nativeEvent });
        window.addEventListener('message', nativeListener, false);
        return {
            remove: () => {
                window.removeEventListener('message', nativeListener);
            },
        };
    },
    getLinkingURL() {
        if (typeof window === 'undefined')
            return '';
        return window.location.href;
    },
};
//# sourceMappingURL=ExpoLinking.web.js.map