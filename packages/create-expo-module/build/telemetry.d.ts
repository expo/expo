import TelemetryClient from '@expo/rudder-sdk-node';
import { CommandOptions } from './types';
export declare function getTelemetryClient(): TelemetryClient;
type Event = {
    event: 'create expo module';
    properties: Record<string, any>;
};
export declare function logEventAsync(event: Event): Promise<void>;
export declare function eventCreateExpoModule(packageManager: string, options: CommandOptions): {
    event: "create expo module";
    properties: {
        nodeVersion: string;
        packageManager: string;
        withTemplate: boolean;
        withReadme: boolean;
        withChangelog: boolean;
        withExample: boolean;
        local: boolean;
    };
};
export {};
