"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GithubApiWrapper {
    constructor(api, owner, repo) {
        this.api = api;
        this.userInfo = {
            owner,
            repo,
        };
    }
    /**
     * Create or update branch from the file map.
     *
     * If the branch exists it will be ovewritten (similar behavior to git push --force).
     */
    async createOrUpdateBranchFromFileMap(fileMap, config) {
        const baseBranchRef = `heads/${config.baseBranchName}`;
        const branchRef = `heads/${config.branchName}`;
        const baseSha = await this.getBaseShaForNewBranch(baseBranchRef);
        const tree = await this.createTree(fileMap, baseSha);
        const commit = await this.api.git.createCommit({
            ...this.userInfo,
            message: config.message,
            tree: tree.sha,
            parents: [baseSha],
        });
        return this.updateOrCreateReference(commit.data.sha, branchRef);
    }
    /**
     * Get currently opened PRs, which are from `ref.fromBranch` to `ref.toBranch`.
     */
    async getOpenPRs(ref) {
        const { data: prs } = await this.api.pulls.list({
            ...this.userInfo,
            state: 'open',
            base: ref.toBranch,
            head: ref.fromBranch,
        });
        return prs;
    }
    /**
     * Create a PR as a user, which was provided in the constructor.
     */
    async openPR(options) {
        const { data: pr } = await this.api.pulls.create({
            ...this.userInfo,
            base: options.toBranch,
            head: options.fromBranch,
            title: options.title,
            body: options.body,
        });
        return pr;
    }
    /**
     * A Git tree object creates the hierarchy between files in a Git repository. To create a tree
     * we need to make a list of blobs (which represent changes to the FS)
     *
     * We want to build on top of the tree that already exists at the latest sha
     *
     * @see https://developer.github.com/v3/git/trees/
     */
    async createTree(fileMap, baseSha) {
        const createBlobs = Object.entries(fileMap).map(([filename, content]) => this.api.git.createBlob({ ...this.userInfo, content }).then(blob => ({
            sha: blob.data.sha,
            path: filename,
            mode: '100644',
            type: 'blob',
        })));
        const blobs = await Promise.all(createBlobs);
        const tree = await this.api.git.createTree({
            ...this.userInfo,
            tree: blobs,
            base_tree: baseSha,
        });
        return tree.data;
    }
    /**
     * Get the base sha for the new branch which will be on the top of the provided one.
     *
     * @param branchRef The ref in the URL must `heads/branch`, not just `branch`
     */
    async getBaseShaForNewBranch(branchRef) {
        const ref = await this.api.git.getRef({
            ...this.userInfo,
            ref: branchRef,
        });
        return ref.data.object.sha;
    }
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
    async updateOrCreateReference(commitSha, ref) {
        const branchExists = await this.checkIfRefExists(ref);
        if (branchExists) {
            return this.api.git.updateRef({
                ...this.userInfo,
                ref,
                force: true,
                sha: commitSha,
            });
        }
        return this.api.git.createRef({
            ...this.userInfo,
            ref: `refs/${ref}`,
            sha: commitSha,
        });
    }
    /**
     * Check if the reference exists via Github api.
     *
     * @param ref The ref in the URL must `heads/branch`, not just `branch`
     */
    async checkIfRefExists(ref) {
        try {
            await this.api.git.getRef({ ...this.userInfo, ref });
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.GithubApiWrapper = GithubApiWrapper;
//# sourceMappingURL=GithubApiWrapper.js.map