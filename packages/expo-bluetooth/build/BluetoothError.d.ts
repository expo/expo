import { NativeError } from './Bluetooth.types';
export default class BluetoothError extends Error implements NativeError {
    code: string;
    domain?: string | null;
    reason?: string | null;
    suggestion?: string | null;
    underlayingError?: string | null;
    _message?: string;
    stackTrace?: string;
    invokedMethod?: string;
    getStackTrace(): string;
    log(): void;
    constructor({ message, code, stackTrace, invokedMethod, domain, reason, suggestion, underlayingError, }: NativeError);
}
