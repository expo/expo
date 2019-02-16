import { CodedError } from 'expo-errors';
import { NativeError } from '../Bluetooth.types';
export default class BluetoothError extends CodedError implements NativeError {
    log(): void;
    toJSON(): {
        [key: string]: any;
    };
    constructor({ name, message, stack, code }: {
        [key: string]: any;
    });
}
