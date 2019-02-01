import { NativeErrorObject, NativeErrorInterface } from './types';
export default class NativeError extends Error implements NativeErrorInterface {
    code: string;
    nativeErrorCode?: string | number;
    nativeErrorMessage?: string;
    constructor(nativeError: NativeErrorObject);
}
