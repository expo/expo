import { DeviceEventEmitter } from 'react-native';
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
/**
 * A method that returns a boolean to indicate if the current application is a development build.
 */
export function isDevelopmentBuild() {
    return !!ExpoDevMenu;
}
//# sourceMappingURL=DevMenu.js.map