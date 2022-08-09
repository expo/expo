/** @depreacted use `resolvePackageManager` instead */
export declare function shouldUseYarn(): boolean;
/** Determine if you should use yarn offline or not */
export declare function isYarnOfflineAsync(): Promise<boolean>;
/** Exposed ror testing */
export declare function getNpmProxy(): string | null;
