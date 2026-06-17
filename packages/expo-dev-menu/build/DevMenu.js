import { AppRegistry, DeviceEventEmitter } from 'react-native';
import ExpoDevMenu from './ExpoDevMenu';
/**
 * A method that opens development client menu when called.
 */
export function openMenu() {
    ExpoDevMenu.openMenu();
}
/**
 * A method that hides development client menu when called.
 */
export function hideMenu() {
    ExpoDevMenu.hideMenu();
}
/**
 * A method that closes development client menu when called.
 */
export function closeMenu() {
    ExpoDevMenu.closeMenu();
}
let hasRegisteredCallbackListener = false;
function registerCallbackListener() {
    if (!hasRegisteredCallbackListener) {
        DeviceEventEmitter.addListener('registeredCallbackFired', (name) => {
            hasRegisteredCallbackListener = true;
            const handler = handlers.get(name);
            if (handler != null) {
                handler();
            }
        });
    }
}
registerCallbackListener();
let handlers = new Map();
/**
 * A method that allows to specify custom entries in the development client menu.
 * @param items
 */
export async function registerDevMenuItems(items) {
    handlers = new Map();
    const callbackNames = [];
    items.forEach((item) => {
        handlers.set(item.name, item.callback);
        callbackNames.push({ name: item.name, shouldCollapse: item.shouldCollapse });
    });
    return await ExpoDevMenu.addDevMenuCallbacks(callbackNames);
}
function syncAvailableAppKeys() {
    if (ExpoDevMenu?.setAvailableAppKeys == null) {
        return;
    }
    // Filter out LogBox, which is registered but isn't really an app key
    const appKeys = AppRegistry.getAppKeys().filter((key) => key !== 'LogBox');
    ExpoDevMenu.setAvailableAppKeys(appKeys);
}
setTimeout(syncAvailableAppKeys, 0);
// Re-sync after a component switch and fast refresh
DeviceEventEmitter.addListener('componentSwitched', syncAvailableAppKeys);
//# sourceMappingURL=DevMenu.js.map