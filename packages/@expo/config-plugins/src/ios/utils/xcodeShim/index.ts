import { XcodeProjectShim } from './XcodeProjectShim';

export { XcodeProjectShim };
export { PbxFile } from './pbxFile';

/**
 * Drop-in replacement for the legacy `xcode.project(filepath)` factory. The
 * returned shim mirrors the old library's two-phase init on top of
 * `@bacons/xcode`:
 *
 *     const project = shim.project(filepath);
 *     project.parseSync();
 *     // ...mutate...
 *     fs.writeFileSync(project.filepath, project.writeSync());
 *
 * @deprecated Bridge for the legacy `xcode` package API; to be removed in a
 * future major of `@expo/config-plugins`.
 */
export function project(filePath: string): XcodeProjectShim {
  return new XcodeProjectShim(filePath);
}
