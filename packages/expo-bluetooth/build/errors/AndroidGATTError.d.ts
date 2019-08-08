import BluetoothPlatformError from './BluetoothPlatformError';
import GATTStatusCode from './GATTStatusCode';
/**
 * An error that is thrown for GATT problems on Android.
 */
export default class AndroidGATTError extends BluetoothPlatformError {
    gattStatusCode: GATTStatusCode;
    constructor({ gattStatusCode, ...props }: {
        invokedMethod?: string;
        gattStatusCode: any;
        stack?: string;
    });
    toJSON(): {
        [key: string]: any;
    };
}
