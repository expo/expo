import { RootPathUtils } from '../../lib/RootPathUtils';
import type { FallbackFilesystem, IgnoreMatcher } from '../../types';
type FallbackFilesystemOptions = {
    rootPathUtils: RootPathUtils;
    extensions: readonly string[];
    ignore: IgnoreMatcher;
    includeSymlinks: boolean;
};
/**
 * Create a FallbackFilesystem that synchronously queries the real filesystem.
 *
 * - `lookup` uses lstatSync to check a single path (for traversal).
 * - `readdir` uses readdirSync to list directory contents (for enumeration).
 *
 * Both methods apply the same filtering as the node crawler: ignore patterns,
 * extension filtering, and symlink inclusion.
 */
export default function createFallbackFilesystem(opts: FallbackFilesystemOptions): FallbackFilesystem;
export declare function shouldFallbackCrawlDir(canonicalPath: string): boolean;
export {};
