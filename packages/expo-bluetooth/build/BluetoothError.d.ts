import { NativeError } from './Bluetooth.types';
export default class BluetoothError extends Error implements NativeError {
    code: string;
    domain?: string | null;
    reason?: string | null;
    suggestion?: string | null;
    underlayingError?: string | null;
    constructor({ message, code, domain, reason, suggestion, underlayingError }: NativeError);
}
