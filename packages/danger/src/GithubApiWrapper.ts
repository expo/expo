/*
 * According to http://www.levibotelho.com/development/commit-a-file-with-the-github-api
 * Base on https://github.com/orta/memfs-or-file-map-to-github-branch
 */
import { Octokit } from '@octokit/rest';

/**
 * The file map contains files content as a value and path as a key.
 * For example:
 * {
 *    'packages/expo-image-picker/CHANGELOG.md': '# Changelog',
 *    'CHANGELOG.md'  : '# Changelog'
 * }
 */
type FileMap = Record<string, string>;

export type CreateBranchOptions = {
  /*
   * The name of the new branch.
   */
  branchName: string;
  /*
   * The name of the base branch.
   */
  baseBranchName: string;
  /*
   * Message for the commit
   */
  message: string;
};

export type PRReferences = {
  /*
   * The name of the branch, which is the PR's target (head of this PR).
   */
  fromBranch: string;
  /*
   * The name of the branch, which is the base of this PR (base of this PR).
   */
  toBranch: string;
};

export type CreatePROptions = PRReferences & {
  /*
   * The PR's title.
   */
  title: string;
  /*
   * The PR's body.
   */
  body: string;
};

export class GithubApiWrapper {
  private userInfo: { owner: string; repo: string };

  constructor(private api: Octokit, owner: string, repo: string) {
    this.userInfo = {
      owner,
      repo,
    };
  }

  /**
   * Creates or updates branch from the file map.
   *
   * If the branch exists it will be overwritten (similar behavior to git push --force).
   */
  async createOrUpdateBranchFromFileMap(
    fileMap: FileMap,
    config: CreateBranchOptions
  ): Promise<Octokit.Response<Octokit.GitUpdateRefResponse | Octokit.GitCreateRefResponse>> {
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
   * Gets currently opened PRs, which are from `ref.fromBranch` to `ref.toBranch`.
   */
  async getOpenPRs(ref: PRReferences): Promise<Octokit.PullsListResponse> {
    const { data: prs } = await this.api.pulls.list({
      ...this.userInfo,
      state: 'open',
      base: ref.toBranch,
      head: ref.fromBranch,
    });
    return prs;
  }

  /**
   * Creates a PR as a user, which was provided in the constructor.
   */
  async openPR(options: CreatePROptions): Promise<Octokit.PullsCreateResponse> {
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
  private async createTree(
    fileMap: FileMap,
    baseSha: string
  ): Promise<Octokit.GitCreateTreeResponse> {
    const createBlobs = Object.entries(fileMap).map(([filename, content]) =>
      this.api.git.createBlob({ ...this.userInfo, content }).then(blob => ({
        sha: blob.data.sha,
        path: filename,
        mode: '100644',
        type: 'blob',
      }))
    );

    const blobs = await Promise.all(createBlobs);
    const tree = await this.api.git.createTree({
      ...this.userInfo,
      tree: blobs as Octokit.GitCreateTreeParamsTree[],
      base_tree: baseSha,
    });
    return tree.data;
  }

  /**
   * Gets the base sha for the new branch which will be on the top of the provided one.
   *
   * @param branchRef The ref in the URL must `heads/branch`, not just `branch`
   */
  private async getBaseShaForNewBranch(branchRef: string): Promise<string> {
    const ref = await this.api.git.getRef({
      ...this.userInfo,
      ref: branchRef,
    });
    return ref.data.object.sha;
  }

  /**
   * Creates or updates the git's reference pointing to the provided commit.
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
  private async updateOrCreateReference(
    commitSha: string,
    ref: string
  ): Promise<Octokit.Response<Octokit.GitUpdateRefResponse | Octokit.GitCreateRefResponse>> {
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
   * Checks if the reference exists via Github api.
   *
   * @param ref The ref in the URL must `heads/branch`, not just `branch`
   */
  private async checkIfRefExists(ref: string): Promise<boolean> {
    try {
      await this.api.git.getRef({ ...this.userInfo, ref });
      return true;
    } catch (error) {
      return false;
    }
  }
}
