import { DeviceEventEmitter } from 'react-native';

import ExpoDevMenu from './ExpoDevMenu';
import { ExpoDevMenuItem } from './ExpoDevMenu.types';

/**
 * A method that opens development client menu when called.
 */
export function openMenu(): void {
  ExpoDevMenu.openMenu();
}

/**
 * A method that hides development client menu when called.
 */
export function hideMenu(): void {
  ExpoDevMenu.hideMenu();
}

/**
 * A method that closes development client menu when called.
 */
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

/**
 * A method that allows to specify custom entries in the development client menu.
 * @param items
 */
export async function registerDevMenuItems(items: ExpoDevMenuItem[]): Promise<void> {
  handlers = new Map();
  const callbackNames: { name: string; shouldCollapse?: boolean }[] = [];

  items.forEach((item) => {
    handlers.set(item.name, item.callback);
    callbackNames.push({ name: item.name, shouldCollapse: item.shouldCollapse });
  });

  return await ExpoDevMenu.addDevMenuCallbacks(callbackNames);
}

export { ExpoDevMenuItem } from './ExpoDevMenu.types';
