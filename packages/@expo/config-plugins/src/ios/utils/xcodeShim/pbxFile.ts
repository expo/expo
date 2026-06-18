// Mirror of `xcode/lib/pbxFile`. Deep-imported by the `Xcodeproj.ts` wrapper,
// `@expo/cli`, and community plugins (e.g. ios-stickers), so Phase 3 must expose
// this at a compatible import path.

export class PbxFile {
  constructor(..._args: any[]) {
    throw new Error('XcodeProjectShim pbxFile is not implemented yet');
  }
}

export default PbxFile;
