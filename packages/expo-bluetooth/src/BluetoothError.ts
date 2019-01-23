import { NativeError } from './Bluetooth.types';

export default class BluetoothError extends Error implements NativeError {
  code: string;
  domain?: string | null;
  reason?: string | null;
  suggestion?: string | null;
  underlayingError?: string | null;

  constructor({ message, code, domain, reason, suggestion, underlayingError }: NativeError) {
    super(`expo-bluetooth: ${message}`);
    this.code = code;
    this.domain = domain;
    this.reason = reason;
    this.suggestion = suggestion;
    this.underlayingError = underlayingError;
  }
}
