import { Platform } from '@unimodules/core';
import invariant from 'invariant';

import { NativeURLListener, URLListener } from './Linking.types';

const EventTypes = ['url'];

const listeners: { listener: URLListener; nativeListener: NativeURLListener }[] = [];

export default {
  addEventListener(type: 'url', listener: URLListener): void {
    invariant(
      EventTypes.indexOf(type) !== -1,
      `Linking.addEventListener(): ${type} is not a valid event`
    );
    const nativeListener: NativeURLListener = nativeEvent =>
      listener({ url: window.location.href, nativeEvent });
    listeners.push({ listener, nativeListener });
    window.addEventListener('message', nativeListener, false);
  },

  removeEventListener(type: 'url', listener: URLListener): void {
    invariant(
      EventTypes.indexOf(type) !== -1,
      `Linking.removeEventListener(): ${type} is not a valid event.`
    );
    const listenerIndex = listeners.findIndex(pair => pair.listener === listener);
    invariant(
      listenerIndex !== -1,
      'Linking.removeEventListener(): cannot remove an unregistered event listener.'
    );
    const nativeListener = listeners[listenerIndex].nativeListener;
    window.removeEventListener('message', nativeListener, false);
    listeners.splice(listenerIndex, 1);
  },

  async canOpenURL(url: string): Promise<boolean> {
    // In reality this should be able to return false for links like `chrome://` on chrome.
    return true;
  },

  async getInitialURL(): Promise<string> {
    if (!Platform.isDOMAvailable) return '';
    return window.location.href;
  },

  async openURL(url: string): Promise<void> {
    if (Platform.isDOMAvailable) {
      // @ts-ignore
      window.location = new URL(url, window.location).toString();
    }
  },
};
