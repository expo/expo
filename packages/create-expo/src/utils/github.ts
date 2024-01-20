/**
 * This GitHub URL pattern should only be applied to the pathname of a URL.
 * It matches the following patterns:
 *   - `github.com/<owner>/<name>` → [, owner, name]
 *   - `github.com/<owner>/<name>/tree/<ref>` → [, owner, name, ref]
 *   - `github.com/<owner>/<name>/tree/<ref>/<folder>` → [, owner, name, ref, folder]
 */
const GITHUB_URL_PATTERN = /([^\\/]+)\/([^\\/]+)(?:\/tree\/([^\\/]+)(?:\/(.*))?)?/;

type GitHubUrlInfo = {
  /** The owner of the repository */
  owner: string;
  /** The name of the repository */
  name: string;
  /** The git reference, either branch, tag, or commit */
  ref?: string;
  /** The (sub)folder of the repository to use */
  folder?: string;
};

/**
 * Parse a GitHub URL into the repository owner and name.
 * URLs may also contain a git reference, and possible (sub)folder.
 * The following URLs are supported:
 *   - `github.com/<owner>/<name>`
 *   - `github.com/<owner>/<name>/tree/<ref>`
 *   - `github.com/<owner>/<name>/tree/<ref>/<folder>`
 */
export function getGithubUrlInfo(uri: string): GitHubUrlInfo | null {
  try {
    const { pathname } = new URL(uri, 'https://github.com');
    const [, owner, name, ref, folder] = pathname.match(GITHUB_URL_PATTERN) || [];

    if (owner && name) {
      return { owner, name, ref, folder };
    }
  } catch {
    // Pass-through
  }

  return null;
}
