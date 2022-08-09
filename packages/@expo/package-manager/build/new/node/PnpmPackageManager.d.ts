import { BasePackageManager } from './BasePackageManager';
export declare class PnpmPackageManager extends BasePackageManager {
    readonly name = "pnpm";
    readonly bin = "pnpm";
    readonly lockFile = "pnpm-lock.yaml";
    workspaceRootAsync(): Promise<string | null>;
    addAsync(namesOrFlags?: string[]): Promise<void>;
    addDevAsync(namesOrFlags?: string[]): Promise<void>;
    addGlobalAsync(namesOrFlags?: string[]): Promise<void>;
    removeAsync(namesOrFlags: string[]): Promise<void>;
    removeDevAsync(namesOrFlags: string[]): Promise<void>;
    removeGlobalAsync(namesOrFlags: string[]): Promise<void>;
}
