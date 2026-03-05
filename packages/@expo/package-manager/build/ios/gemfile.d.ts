/** Finds a Gemfile in the target directory or a parent, stopping at the Git or workspace root. */
export declare function findGemfile(root?: string): Promise<string | null>;
/**
 * Check if the project uses Bundler to manage CocoaPods.
 * Returns `true` if a `Gemfile` exists in the project root (or a parent)
 * that lists `cocoapods` as a dependency, and `bundle exec pod --version` succeeds.
 */
export declare function isUsingBundlerAsync(projectRoot: string): Promise<boolean>;
