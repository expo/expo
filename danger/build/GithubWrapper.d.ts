import { Octokit } from '@octokit/rest';
declare type FileMap = {
    [key: string]: string;
};
export declare type CreateBranchOptions = {
    branchName: string;
    baseBranchName: string;
    message: string;
};
export declare type PRReferences = {
    fromBranch: string;
    toBranch: string;
};
export declare type CreatePROption = PRReferences & {
    title: string;
    body: string;
};
export declare class GithubWrapper {
    private api;
    private userInfo;
    constructor(api: Octokit, owner: string, repo: string);
    /**
     * Create or update branch from the file map.
     *
     * If the branch exists it will be ovewritten (similar behavior to git push --force).
     *
     * The file map contains files content as a value and path as a key.
     * For example:
     * {
     *    'packages/expo-image-picker/CHANGELOG.md': '# Changelog',
     *    'CHANGELOG.md'  : '# Changelog'
     * }
     */
    createOrUpdateBranchFromFileMap(fileMap: FileMap, config: CreateBranchOptions): Promise<Octokit.Response<Octokit.GitUpdateRefResponse | Octokit.GitCreateRefResponse>>;
    /**
     * Get currently opened PRs, which are from `ref.fromBranch` to `ref.toBranch`.
     */
    getOpenPR(ref: PRReferences): Promise<Octokit.PullsListResponse>;
    /**
     * Create a PR as a user, which was provided in the constructor.
     */
    openPR(options: CreatePROption): Promise<Octokit.PullsCreateResponse>;
    /**
     * A Git tree object creates the hierarchy between files in a Git repository. To create a tree
     * we need to make a list of blobs (which represent changes to the FS)
     *
     * We want to build on top of the tree that already exists at the last sha
     *
     * @see https://developer.github.com/v3/git/trees/
     */
    private createTree;
    /**
     * Get the base sha for the new branch which will be on the top of the provided one.
     *
     * @param branchRef The ref in the URL must `heads/branch`, not just `branch`
     */
    private getBaseShaForNewBranch;
    /**
     * Create or update the git's reference pointing to the provided commit.
     * If this reference exists, it will be overwritten (similar behavior to git push --force).
     *
     * A Git reference (git ref) is just a file that contains a Git commit SHA-1 hash. When referring
     * to a Git commit, you can use the Git reference, which is an easy-to-remember name, rather than
     * the hash. The Git reference can be rewritten to point to a new commit.
     *
     * @param ref The ref in the URL must `heads/branch`, not just `branch`
     *
     * @see https://developer.github.com/v3/git/refs/#git-references
     */
    private updateOrCreateReference;
    /**
     * Check if the reference exists via Github api.
     *
     * @param ref The ref in the URL must `heads/branch`, not just `branch`
     */
    private checkIfRefExists;
}
export {};
