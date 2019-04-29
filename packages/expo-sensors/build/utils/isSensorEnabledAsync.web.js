// iOS 12.2 disables DeviceMotion by default now
// https://github.com/w3c/deviceorientation/issues/57
export async function assertSensorEventEnabledAsync(eventName, timeout) {
    if (!isIOS()) {
        return true;
    }
    if (await isSensorEnabledAsync(eventName, timeout)) {
        return true;
    }
    throw new Error(`Cannot observe event: ${eventName}.` +
        '\nEnable device orientation in Settings > Safari > Motion & Orientation Access' +
        '\nalso ensure that you are hosting with https as DeviceMotion is now a secure API on iOS Safari.');
}
// throw error if the sensor is disabled.
export function isSensorEnabledAsync(eventName, timeout = 250) {
    return new Promise(resolve => {
        const id = setTimeout(() => {
            window.removeEventListener(eventName, listener);
            resolve(false);
        }, timeout);
        const listener = () => {
            clearTimeout(id);
            window.removeEventListener(eventName, listener);
            resolve(true);
        };
        window.addEventListener(eventName, listener);
    });
}
// https://stackoverflow.com/a/9039885/4047926
function isIOS() {
    const isIOSUA = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    const isIE11 = !!window['MSStream'];
    return isIOSUA && !isIE11;
}
export default isSensorEnabledAsync;
//# sourceMappingURL=isSensorEnabledAsync.web.js.map