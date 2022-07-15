/// <reference types="expo__bunyan" />
import Log from '@expo/bunyan';
import { HandleFunction } from 'connect';
export default function clientLogsMiddleware(logger: Log): HandleFunction;
export declare function getDevicePlatformFromAppRegistryStartupMessage(body: string[]): string | null;
