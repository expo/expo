import BluetoothPlatformError from './BluetoothError';
import GATTStatusCode from '../GATTStatusCode';
export declare class AndroidGATTError extends BluetoothPlatformError {
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
