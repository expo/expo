import invariant from 'invariant';

import { URLListener } from './Linking.types';

export default {
  addListener(eventName: 'onURLReceived' | string, listener: URLListener): { remove(): void } {
    invariant(
      eventName === 'onURLReceived',
      `Linking.addListener(): ${eventName} is not a valid event`
    );
    // Do nothing in Node.js environments
    if (typeof window === 'undefined') {
      return { remove() {} };
    }

    const nativeListener = (nativeEvent: MessageEvent) =>
      listener({ url: window.location.href, nativeEvent });
    window.addEventListener('message', nativeListener, false);
    return {
      remove: () => {
        window.removeEventListener('message', nativeListener);
      },
    };
  },

  getLinkingURL(): string {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  },
};
