import { Platform } from './Platform';
export declare const delay: (ms: number) => Promise<void>;
export declare function killEmulatorAsync(): Promise<void>;
export declare function killSimulatorAsync(): Promise<void>;
export declare function killVirtualDevicesAsync(platform: Platform): Promise<void>;
