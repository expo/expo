/**
 * This function checks if the changelog was modified, doing the following steps:
 * - get packages which were modified but don't have changes in `CHANGELOG.md`
 * - parse PR body to get suggested entries for those packages
 * - run `et add-changelog` for each package to apply the suggestion
 * - create a new PR
 * - add a comment to inform about missing changelog
 * - fail CI job
 */
export declare function checkChangelog(): Promise<void>;
