import { PermissionResponse } from 'expo-modules-core';
declare type SensorEventName = 'deviceorientation' | 'devicemotion';
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
export declare function getRequestPermission(): (() => Promise<PermissionState>) | null;
export declare function assertSensorEventEnabledAsync(eventName: SensorEventName, timeout?: number): Promise<boolean>;
export declare function isSensorEnabledAsync(eventName: SensorEventName, timeout?: number): Promise<boolean>;
export {};
