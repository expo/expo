"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveParentId = resolveParentId;
exports.useNavigation = useNavigation;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _Route() {
  const data = require("./Route");
  _Route = function () {
    return data;
  };
  return data;
}
function _matchers() {
  const data = require("./matchers");
  _matchers = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Return the navigation object for the current route.
 * @param parent Provide an absolute path like `/(root)` to the parent route or a relative path like `../../` to the parent route.
 * @returns the navigation object for the provided route.
 */
function useNavigation(parent) {
  const navigation = (0, _native().useNavigation)();
  const contextKey = (0, _Route().useContextKey)();
  const normalizedParent = _react().default.useMemo(() => {
    if (!parent) {
      return null;
    }
    const normalized = (0, _matchers().getNameFromFilePath)(parent);
    if (parent.startsWith('.')) {
      return relativePaths(contextKey, parent);
    }
    return normalized;
  }, [contextKey, parent]);
  if (normalizedParent != null) {
    const parentNavigation = navigation.getParent(normalizedParent);

    // TODO: Maybe print a list of parents...

    if (!parentNavigation) {
      throw new Error(`Could not find parent navigation with route "${parent}".` + (normalizedParent !== parent ? ` (normalized: ${normalizedParent})` : ''));
    }
    return parentNavigation;
  }
  return navigation;
}
function resolveParentId(contextKey, parentId) {
  if (!parentId) {
    return null;
  }
  if (parentId.startsWith('.')) {
    return (0, _matchers().getNameFromFilePath)(relativePaths(contextKey, parentId));
  }
  return (0, _matchers().getNameFromFilePath)(parentId);
}

// Resolve a path like `../` relative to a path like `/foo/bar`
function relativePaths(from, to) {
  const fromParts = from.split('/').filter(Boolean);
  const toParts = to.split('/').filter(Boolean);
  for (const part of toParts) {
    if (part === '..') {
      if (fromParts.length === 0) {
        throw new Error(`Cannot resolve path "${to}" relative to "${from}"`);
      }
      fromParts.pop();
    } else if (part === '.') {
      // Ignore
    } else {
      fromParts.push(part);
    }
  }
  return '/' + fromParts.join('/');
}
//# sourceMappingURL=useNavigation.js.map