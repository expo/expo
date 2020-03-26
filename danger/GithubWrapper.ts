/*
 * According to http://www.levibotelho.com/development/commit-a-file-with-the-github-api
 * Base on https://github.com/orta/memfs-or-file-map-to-github-branch
 */
import { Octokit } from '@octokit/rest';

type FileMap = {
  [key: string]: string;
};

export type CreateBranchOptions = {
  /*
   * The ref in the URL must `heads/branch`, not just `branch`
   */
  branchRef: string;
  /*
   *  The ref in the URL must `heads/branch`, not just `branch`
   */
  baseBranchRef: string;
  /*
   * Message for the commit
   */
  message: string;
};

export class GithubWrapper {
  private api: Octokit;
  private userInfo: { owner: string; repo: string };

  constructor(api: Octokit, owner: string, repo: string) {
    this.api = api;
    this.userInfo = {
      owner,
      repo,
    };
  }

  /*
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
  async createOrUpdateBranchFromFileMap(
    fileMap: FileMap,
    config: CreateBranchOptions
  ): Promise<Octokit.Response<Octokit.GitUpdateRefResponse | Octokit.GitCreateRefResponse>> {
    const baseSha = await this.getBaseShaForNewBranch(config.baseBranchRef);
    const tree = await this.createTree(fileMap, baseSha);

    const commit = await this.api.git.createCommit({
      ...this.userInfo,
      message: config.message,
      tree: tree.sha,
      parents: [baseSha],
    });

    return this.updateOrCreateReference(commit.data.sha, config.branchRef);
  }

  /**
   * A Git tree object creates the hierarchy between files in a Git repository. To create a tree
   * we need to make a list of blobs (which represent changes to the FS)
   *
   * We want to build on top of the tree that already exists at the last sha
   *
   * @see https://developer.github.com/v3/git/trees/
   */
  private async createTree(
    fileMap: FileMap,
    baseSha: string
  ): Promise<Octokit.GitCreateTreeResponse> {
    const createBlobs = Object.keys(fileMap).map(filename =>
      this.api.git
        .createBlob({ ...this.userInfo, content: fileMap[filename] })
        .then((blob: any) => ({
          sha: blob.data.sha,
          path: filename,
          mode: '100644',
          type: 'blob',
        }))
    );

    const blobs = await Promise.all(createBlobs);
    const tree = await this.api.git.createTree({
      ...this.userInfo,
      tree: blobs as any,
      base_tree: baseSha,
    });
    return tree.data;
  }

  /*
   * Get the base sha for the new branch which will be on the top of the provided one.
   */
  private async getBaseShaForNewBranch(branchRef: string): Promise<string> {
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

  /*
   * Check if the reference exists via Github api.
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
