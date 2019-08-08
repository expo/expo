import BluetoothError from './BluetoothError';
export default class BluetoothPlatformError extends BluetoothError {
    invokedMethod: string;
    constructor({ name, message, stack, code, invokedMethod }: {
        [key: string]: any;
    });
    toJSON(): {
        [key: string]: any;
    };
}
