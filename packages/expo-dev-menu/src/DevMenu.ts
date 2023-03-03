import { DeviceEventEmitter } from 'react-native';

import ExpoDevMenu from './ExpoDevMenu';
import { ExpoDevMenuItem } from './ExpoDevMenu.types';

export function openMenu(): void {
  ExpoDevMenu.openMenu();
}

export function hideMenu(): void {
  ExpoDevMenu.hideMenu();
}

export function closeMenu(): void {
  ExpoDevMenu.closeMenu();
}

let hasRegisteredCallbackListener = false;

function registerCallbackListener() {
  if (!hasRegisteredCallbackListener) {
    DeviceEventEmitter.addListener('registeredCallbackFired', (name: string) => {
      hasRegisteredCallbackListener = true;
      const handler = handlers.get(name);

      if (handler != null) {
        handler();
      }
    });
  }
}

registerCallbackListener();

let handlers = new Map<string, () => void>();

export async function registerDevMenuItems(items: ExpoDevMenuItem[]) {
  if (!__DEV__) {
    // resolve undefined
    return;
  }

  handlers = new Map();
  const callbackNames: { name: string; shouldCollapse?: boolean }[] = [];

  items.forEach((item) => {
    handlers.set(item.name, item.callback);
    callbackNames.push({ name: item.name, shouldCollapse: item.shouldCollapse });
  });

  return await ExpoDevMenu.addDevMenuCallbacks(callbackNames);
}
