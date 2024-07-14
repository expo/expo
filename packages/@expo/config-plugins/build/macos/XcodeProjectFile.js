"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withBuildSourceFile = exports.createBuildSourceFile = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/XcodeProjectFile"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Create a build source file and link it to Xcode.
 *
 * @param config
 * @param props.filePath relative to the build source folder. ex: `ViewController.swift` would be created in `macos/myapp/ViewController.swift`.
 * @param props.contents file contents to write.
 * @param props.overwrite should the contents overwrite any existing file in the same location on disk.
 * @returns
 */
const withBuildSourceFile = exports.withBuildSourceFile = AppleImpl().withBuildSourceFile('macos');

/**
 * Add a source file to the Xcode project and write it to the file system.
 *
 * @param nativeProjectRoot absolute path to the native app root `user/app/macos` or `user/app/macos`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/macos/myapp/foobar.swift` or `user/app/macos/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
const createBuildSourceFile = exports.createBuildSourceFile = AppleImpl().createBuildSourceFile('macos');
//# sourceMappingURL=XcodeProjectFile.js.map