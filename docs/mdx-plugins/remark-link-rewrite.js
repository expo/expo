const path = require('path');
const visit = require('unist-util-visit');
const { URL } = require('url');

const DEFAULT_OPTIONS = {
  extension: 'md',
  pageDir: 'pages',
  trailingSlash: true,
};

/**
 * This rewrites relative MDX links to something Next would expect.
 *   - Replaces the `.md` extension with a trailing slash.
 *     e.g. from: /push-notifications/overview.md, to: ./using-fcm.md -> ../using-fcm/
 *   - Rewrites to absolute path from the page directory (backwards compatibility)
 *     e.g. from: /push-notifications/overview.md, to ../using-fcm/ -> /push-notifications/using-fcm/
 *
 * @param {object} options
 * @param {string} [options.extension="md"]
 * @param {string} [options.pageDir="pages"]
 * @param {boolean} [options.trailingSlash=true]
 * @returns {function} remark plugin
 */
module.exports = function remarkLinkRewrite(options) {
  const settings = Object.assign({}, DEFAULT_OPTIONS, options);

  return (tree, file) => {
    // get the relative path, from pages dir to the current file
    const filePrefix = getFilePrefix(settings, file);

    visit(tree, 'link', node => {
      if (!isFullUrl(node)) {
        // remove the `.md` or replace it with a trailing `/`
        node.url = getPathWithoutExt(settings, node.url);
        // if the path is relative, we need to clean it for Next
        node.url = getPathRelativeUrl(filePrefix, node.url);
      }
    });
  };
};

/**
 * Remove the extension from the path, if it has one.
 * It removes or replaces it with a trailing slash, if that's enabled.
 */
function getPathWithoutExt(options, url) {
  return url.replace(`.${options.extension}`, options.trailingSlash ? '/' : '');
}

/**
 * If the path starts with either `./` or `../` we need to clean this.
 * Next doesn't work nicely with these kinds of paths.
 *   - from: /push-notifications/overview/, to: sending-notifications/ -> sending-notifications/
 *   - from: /push-notifications/overview/, to: ./sending-notifications/ -> /push-notifications/sending-notifications/
 *   - from: /push-notifications/overview/, to: ../sending-notifications/ -> /push-notifications/sending-notifications/
 *
 * @todo remove this if we only have direct file reference links, this is required for backwards compatibility
 */
function getPathRelativeUrl(filePrefix, url) {
  if (!url.startsWith('./') && !url.startsWith('../')) {
    return url;
  }
  // both `./` and `../` must be handled as "go 1 up", because of how we anticipated trailing `/` exports
  return path.join(filePrefix || '/', url.replace(/^\.\//, '../'));
}

/**
 * Get the prefix of the file that should be added in all URLs.
 * This is calculated from the absolute file path and Next `pages` directory.
 *   - /path/to/docs/pages/push-notifications/overview.md -> /push-notifications/overview/
 *   - /path/to/docs/pages/index.md -> /
 */
function getFilePrefix(settings, file) {
  if (!file.history || !file.history.length) {
    return;
  }

  const pagePath = path.join(file.cwd, settings.pageDir);
  const filePath = path.relative(pagePath, file.history[0]);
  const fileUrl = getPathWithoutExt(settings, `/${filePath}`);
  const ignored = settings.trailingSlash ? '/index/' : '/index';

  if (fileUrl !== ignored) {
    return fileUrl;
  }
}

/**
 * Determine if the node contains a valid URL.
 * If so, we have to skip this, we only want to rewrite internal links.
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
