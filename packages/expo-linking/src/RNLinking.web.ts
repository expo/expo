import invariant from 'invariant';

import { NativeURLListener, URLListener } from './Linking.types';

const listeners: { listener: URLListener; nativeListener: NativeURLListener }[] = [];

export default {
  addEventListener(type: 'url', listener: URLListener): { remove(): void } {
    // Do nothing in Node.js environments
    if (typeof window === 'undefined') {
      return { remove() {} };
    }

    invariant(type === 'url', `Linking.addEventListener(): ${type} is not a valid event`);
    const nativeListener: NativeURLListener = (nativeEvent) =>
      listener({ url: window.location.href, nativeEvent });
    listeners.push({ listener, nativeListener });
    window.addEventListener('message', nativeListener, false);
    return {
      remove: () => {
        this.removeEventListener(type, listener);
      },
    };
  },

  removeEventListener(type: 'url', listener: URLListener): void {
    // Do nothing in Node.js environments
    if (typeof window === 'undefined') {
      return;
    }
    invariant(type === 'url', `Linking.addEventListener(): ${type} is not a valid event`);
    const listenerIndex = listeners.findIndex((pair) => pair.listener === listener);
    invariant(
      listenerIndex !== -1,
      'Linking.removeEventListener(): cannot remove an unregistered event listener.'
    );
    const nativeListener = listeners[listenerIndex].nativeListener;
    window.removeEventListener('message', nativeListener, false);
    listeners.splice(listenerIndex, 1);
  },

  async canOpenURL(): Promise<boolean> {
    // In reality this should be able to return false for links like `chrome://` on chrome.
    return true;
  },

  async getInitialURL(): Promise<string> {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  },

  async openURL(url: string): Promise<void> {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.location = new URL(url, window.location).toString();
    }
  },
};
