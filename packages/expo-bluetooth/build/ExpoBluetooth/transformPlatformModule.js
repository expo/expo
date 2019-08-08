import BluetoothPlatformError from '../errors/BluetoothPlatformError';
import AndroidGATTError from '../errors/AndroidGATTError';
/**
 * Wrap the native method and transform the errors that are returned
 *
 * @param platformModule The BLE Native method
 */
export default function platformModuleWithCustomErrors(platformModule) {
    const platform = {};
    for (const property of Object.keys(platformModule)) {
        if (typeof platformModule[property] !== 'function') {
            Object.defineProperty(platform, property, {
                get() {
                    return platformModule[property];
                },
            });
        }
        else {
            platform[property] = methodWithTransformedError(platformModule[property], property);
        }
    }
    Object.freeze(platform);
    return platform;
}
function methodWithTransformedError(method, methodName) {
    /** Stack trace without async layers */
    const stack = decodeURI(new Error().stack || '');
    return (...props) => {
        try {
            // console.log(`EXBLE: invoke: ${methodName}()`);
            return method(...props);
        }
        catch ({ message, code, ...props }) {
            /**
             * If an error is related to the device GATT then throw a `AndroidGATTError`
             */
            if (code.indexOf('ERR_BLE_GATT:') > -1) {
                const gattStatusCode = code.split(':')[1];
                throw new AndroidGATTError({
                    gattStatusCode: parseInt(gattStatusCode),
                    stack,
                    invokedMethod: methodName,
                });
            }
            throw new BluetoothPlatformError({
                message,
                code,
                ...props,
                invokedMethod: methodName,
                stack,
            });
        }
    };
}
//# sourceMappingURL=transformPlatformModule.js.map