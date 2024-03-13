"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getContextKey = getContextKey;
exports.getNameFromFilePath = getNameFromFilePath;
exports.isTypedRoute = isTypedRoute;
exports.matchArrayGroupName = matchArrayGroupName;
exports.matchDeepDynamicRouteName = matchDeepDynamicRouteName;
exports.matchDynamicName = matchDynamicName;
exports.matchGroupName = matchGroupName;
exports.removeFileSystemDots = removeFileSystemDots;
exports.removeSupportedExtensions = removeSupportedExtensions;
exports.stripGroupSegmentsFromPath = stripGroupSegmentsFromPath;
exports.stripInvisibleSegmentsFromPath = stripInvisibleSegmentsFromPath;
exports.testNotFound = testNotFound;
/** Match `[page]` -> `page` */
function matchDynamicName(name) {
  // Don't match `...` or `[` or `]` inside the brackets
  // eslint-disable-next-line no-useless-escape
  return name.match(/^\[([^[\](?:\.\.\.)]+?)\]$/)?.[1];
}

/** Match `[...page]` -> `page` */
function matchDeepDynamicRouteName(name) {
  return name.match(/^\[\.\.\.([^/]+?)\]$/)?.[1];
}

/** Test `/` -> `page` */
function testNotFound(name) {
  return /\+not-found$/.test(name);
}

/** Match `(page)` -> `page` */
function matchGroupName(name) {
  return name.match(/^(?:[^\\(\\)])*?\(([^\\/]+)\).*?$/)?.[1];
}

/** Match the first array group name `(a,b,c)/(d,c)` -> `'a,b,c'` */
function matchArrayGroupName(name) {
  return name.match(/(?:[^\\(\\)])*?\(([^\\/]+,[^\\/]+)\).*?$/)?.[1];
}
function getNameFromFilePath(name) {
  return removeSupportedExtensions(removeFileSystemDots(name));
}
function getContextKey(name) {
  // The root path is `` (empty string) so always prepend `/` to ensure
  // there is some value.
  const normal = '/' + getNameFromFilePath(name);
  if (!normal.endsWith('_layout')) {
    return normal;
  }
  return normal.replace(/\/?_layout$/, '');
}

/** Remove `.js`, `.ts`, `.jsx`, `.tsx` */
function removeSupportedExtensions(name) {
  return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}

// Remove any amount of `./` and `../` from the start of the string
function removeFileSystemDots(filePath) {
  return filePath.replace(/^(?:\.\.?\/)+/g, '');
}
function stripGroupSegmentsFromPath(path) {
  return path.split('/').reduce((acc, v) => {
    if (matchGroupName(v) == null) {
      acc.push(v);
    }
    return acc;
  }, []).join('/');
}
function stripInvisibleSegmentsFromPath(path) {
  return stripGroupSegmentsFromPath(path).replace(/\/?index$/, '');
}

/**
 * Match:
 *  - _layout files, +html, +not-found, string+api, etc
 *  - Routes can still use `+`, but it cannot be in the last segment.
 */
function isTypedRoute(name) {
  return !name.startsWith('+') && name.match(/(_layout|[^/]*?\+[^/]*?)\.[tj]sx?$/) === null;
}
//# sourceMappingURL=matchers.js.map