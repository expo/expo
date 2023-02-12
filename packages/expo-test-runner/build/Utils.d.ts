import { Platform } from './Platform';
export declare function yarnInstall(path: string): void;
export declare const delay: (ms: number) => Promise<void>;
export declare function killEmulatorAsync(): Promise<void>;
export declare function killSimulatorAsync(): Promise<void>;
export declare function killVirtualDevicesAsync(platform: Platform): Promise<void>;
