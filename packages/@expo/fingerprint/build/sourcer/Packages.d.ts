import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
interface PackageSourcerParams {
    /**
     * The package name.
     *
     * Note that the package should be a direct dependency or devDependency of the project.
     * Otherwise on pnpm isolated mode the resolution will fail.
     */
    packageName: string;
    /**
     * Hashing **package.json** file for the package rather than the entire directory.
     * This is useful when the package contains a lot of files.
     */
    packageJsonOnly: boolean;
}
export declare function getDefaultPackageSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getPackageSourceAsync(projectRoot: string, params: PackageSourcerParams): Promise<HashSource | null>;
export {};
