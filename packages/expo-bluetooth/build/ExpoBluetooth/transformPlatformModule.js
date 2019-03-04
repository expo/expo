import BluetoothPlatformError from '../errors/BluetoothPlatformError';
import AndroidGATTError from '../errors/AndroidGATTError';
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
    return async (...props) => {
        try {
            console.log(`EXBLE: invoke: ${methodName}()`);
            return await method(...props);
        }
        catch ({ message, code, ...props }) {
            let error;
            if (code.indexOf('ERR_BLE_GATT:') > -1) {
                const gattStatusCode = code.split(':')[1];
                error = new AndroidGATTError({
                    gattStatusCode: parseInt(gattStatusCode),
                    stack,
                    invokedMethod: methodName,
                });
            }
            error = new BluetoothPlatformError({
                message,
                code,
                ...props,
                invokedMethod: methodName,
                stack,
            });
            error.log();
            throw error;
        }
    };
}
//# sourceMappingURL=transformPlatformModule.js.map