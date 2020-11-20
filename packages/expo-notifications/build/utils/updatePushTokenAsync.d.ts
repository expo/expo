import { AbortSignal } from 'abort-controller';
import { DevicePushToken } from '../Tokens.types';
export declare function updatePushTokenAsync(signal: AbortSignal, token: DevicePushToken): Promise<void>;
