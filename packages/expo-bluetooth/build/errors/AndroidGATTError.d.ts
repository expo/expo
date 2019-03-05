import BluetoothPlatformError from './BluetoothPlatformError';
import GATTStatusCode from './GATTStatusCode';
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
