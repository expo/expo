import path from 'path';
import { visit } from 'unist-util-visit';
import { URL } from 'url';

/**
 * @typedef {import('@types/mdast').Root} Root - https://github.com/syntax-tree/mdast#root
 * @typedef {import('vfile').VFile} VFile - https://github.com/syntax-tree/unist#file
 */

const DEFAULT_OPTIONS = {
  extension: 'mdx',
  pagesDir: 'pages',
  trailingSlash: true,
};

// This is a fallback domain, used to parse URLs. If origin matches this, its an internal link
const FAKE_DOMAIN = 'https://fake.domain';

/**
 * This rewrites internal MDX links to absolute URLs from the root domain.
 * It's the similar behavior of GitHub MDX linking, but for Next.
 *
 * @param {object} options
 * @param {string} [options.extension="md"]
 * @param {string} [options.pagesDir="pages"]
 * @param {boolean} [options.trailingSlash=true]
 * @returns {function} remark plugin
 */
export default function remarkLinkRewrite(options) {
  const settings = { ...DEFAULT_OPTIONS, ...options };

  /**
   * @param {Root} tree
   * @param {VFile} file
   */
  return (tree, file) => {
    // we can't rewrite files without knowing where the file exists
    if (!file.cwd || !file.history || !file.history.length) {
      return;
    }
    // index references should be ignored, it's handled by Next
    const ignoredIndex = 'index' + (settings.trailingSlash ? '/' : '');

    visit(tree, 'link', node => {
      // parse the url with a fallback fake domain, used to determine if it's internal or not
      const ref = new URL(node.url, FAKE_DOMAIN);
      // only rewrite internal non-url nodes
      if (ref.origin === FAKE_DOMAIN) {
        // if only a hash is provided, we need to calculate from the same file
        const oldUrl =
          ref.hash && ref.pathname === '/'
            ? `${path.basename(file.history[0])}${ref.hash}`
            : node.url;

        // resolve the absolute path to the linked md file (supports hashes)
        const absolute = path.resolve(path.dirname(file.history[0]), oldUrl);
        // resolve the relative path between the linked file and our pages dir (root of the website)
        const relative = path.relative(path.join(file.cwd, settings.pagesDir), absolute);
        // rewrite the URL without the `.md` extension, using trailing slash or nothing
        let newUrl = relative.replace(`.${settings.extension}`, settings.trailingSlash ? '/' : '');

        // if the url is referencing the ignored index, remove it
        if (newUrl.includes(ignoredIndex)) {
          newUrl = newUrl.replace(ignoredIndex, '');
        }

        // force forward slash on non-posix systems
        node.url = `/${newUrl.replace(/\\/g, '/')}`;
      }
    });
  };
}
