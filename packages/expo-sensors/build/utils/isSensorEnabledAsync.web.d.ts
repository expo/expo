declare type SensorEventName = 'deviceorientation' | 'devicemotion';
export declare function assertSensorEventEnabledAsync(eventName: SensorEventName, timeout?: number): Promise<boolean>;
export declare function assertEventEnabledAsync(eventName: string, timeout?: number): Promise<boolean>;
export declare function isSensorEnabledAsync(eventName: SensorEventName, timeout?: number): Promise<boolean>;
export default isSensorEnabledAsync;
