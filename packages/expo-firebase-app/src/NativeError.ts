import { NativeErrorObject, NativeErrorInterface } from './types';

export default class NativeError extends Error implements NativeErrorInterface {
  code: string;
  nativeErrorCode?: string | number;
  nativeErrorMessage?: string;

  constructor(nativeError: NativeErrorObject) {
    super(nativeError.message);
    this.code = nativeError.code;
    this.message = nativeError.message;
    this.nativeErrorCode = nativeError.nativeErrorCode;
    this.nativeErrorMessage = nativeError.nativeErrorMessage;
  }
}
