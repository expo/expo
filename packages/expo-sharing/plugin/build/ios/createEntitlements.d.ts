export type ShareIntoEntitlements = Record<string, string[]>;
export declare function createEntitlements(appGroupId: string): ShareIntoEntitlements;
export declare function createEntitlementsFile(targetDirectory: string, extensionTargetName: string, appGroupId: string): void;
