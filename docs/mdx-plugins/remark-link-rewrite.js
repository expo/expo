const path = require('path');
const visit = require('unist-util-visit');
const { URL } = require('url');

const DEFAULT_OPTIONS = {
  extension: 'md',
  pagesDir: 'pages',
  trailingSlash: true,
};

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
module.exports = function remarkLinkRewrite(options) {
  const settings = Object.assign({}, DEFAULT_OPTIONS, options);

  return (tree, file) => {
    // we can't rewrite files without knowing where the file exists
    if (!file.cwd || !file.history || !file.history.length) {
      return;
    }
    // index references should be ignored, it's handled by Next
    const ignoredIndex = 'index' + (settings.trailingSlash ? '/' : '');

    visit(tree, 'link', node => {
      // only rewrite internal non-url nodes
      if (!isFullUrl(node)) {
        // resolve the absolute path to the linked md file (supports hashes)
        const absolute = path.resolve(path.dirname(file.history[0]), node.url);
        // resolve the relative path between the linked file and our pages dir (root of the website)
        const relative = path.relative(path.join(file.cwd, settings.pagesDir), absolute);
        // rewrite the URL without the `.md` extension, using trailing slash or nothing
        let url = relative.replace(`.${settings.extension}`, settings.trailingSlash ? '/' : '');

        // if the url is referencing the ignored index, remove it
        if (url.includes(ignoredIndex)) {
          url = url.replace(ignoredIndex, '');
        }

        node.url = `/${url}`;
      }
    });
  };
};

/**
 * Determine if the node contains a valid URL.
 */
function isFullUrl(node) {
  try {
    // eslint-disable-next-line no-new
    new URL(node.url);
    return true;
  } catch {
    return false;
  }
}
