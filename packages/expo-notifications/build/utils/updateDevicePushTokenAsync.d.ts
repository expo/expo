import { AbortSignal } from 'abort-controller';
import { DevicePushToken } from '../Tokens.types';
export declare function updateDevicePushTokenAsync(signal: AbortSignal, token: DevicePushToken): Promise<void>;
