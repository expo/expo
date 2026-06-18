import { XcodeProject } from '@bacons/xcode';
import { build } from '@bacons/xcode/json';
import path from 'path';

function notImplemented(method: string): never {
  throw new Error(`XcodeProjectShim.${method} is not implemented yet`);
}

/**
 * Backwards-compatible facade exposing the legacy `xcode` `XcodeProject` API on
 * top of a typed `@bacons/xcode` project. The substrate (construct / parse /
 * serialize) is live; every legacy query/mutation method is stubbed until the
 * differential harness drives its implementation.
 */
export class XcodeProjectShim {
  filepath: string;

  private project: XcodeProject | null = null;

  constructor(filePath: string) {
    this.filepath = path.resolve(filePath);
  }

  private get inner(): XcodeProject {
    if (!this.project) {
      throw new Error(
        `XcodeProjectShim: the project has not been parsed. Call parseSync() before reading or writing it.`
      );
    }
    return this.project;
  }

  // === Lifecycle / IO ===

  parseSync(): this {
    this.project = XcodeProject.open(this.filepath);
    return this;
  }

  parse(..._args: any[]): any {
    notImplemented('parse');
  }

  writeSync(): string {
    return build(this.inner.toJSON());
  }

  get hash(): any {
    return notImplemented('hash');
  }

  allUuids(..._args: any[]): any {
    notImplemented('allUuids');
  }

  generateUuid(..._args: any[]): any {
    notImplemented('generateUuid');
  }

  // === Read / query ===

  pbxProjectSection(..._args: any[]): any {
    notImplemented('pbxProjectSection');
  }
  pbxNativeTargetSection(..._args: any[]): any {
    notImplemented('pbxNativeTargetSection');
  }
  pbxXCBuildConfigurationSection(..._args: any[]): any {
    notImplemented('pbxXCBuildConfigurationSection');
  }
  pbxXCConfigurationList(..._args: any[]): any {
    notImplemented('pbxXCConfigurationList');
  }
  pbxFileReferenceSection(..._args: any[]): any {
    notImplemented('pbxFileReferenceSection');
  }
  pbxBuildFileSection(..._args: any[]): any {
    notImplemented('pbxBuildFileSection');
  }
  xcVersionGroupSection(..._args: any[]): any {
    notImplemented('xcVersionGroupSection');
  }
  pbxGroupByName(..._args: any[]): any {
    notImplemented('pbxGroupByName');
  }
  pbxResourcesBuildPhaseObj(..._args: any[]): any {
    notImplemented('pbxResourcesBuildPhaseObj');
  }
  pbxSourcesBuildPhaseObj(..._args: any[]): any {
    notImplemented('pbxSourcesBuildPhaseObj');
  }
  pbxFrameworksBuildPhaseObj(..._args: any[]): any {
    notImplemented('pbxFrameworksBuildPhaseObj');
  }
  pbxEmbedFrameworksBuildPhaseObj(..._args: any[]): any {
    notImplemented('pbxEmbedFrameworksBuildPhaseObj');
  }
  pbxCopyfilesBuildPhaseObj(..._args: any[]): any {
    notImplemented('pbxCopyfilesBuildPhaseObj');
  }
  buildPhase(..._args: any[]): any {
    notImplemented('buildPhase');
  }
  buildPhaseObject(..._args: any[]): any {
    notImplemented('buildPhaseObject');
  }
  getFirstProject(..._args: any[]): any {
    notImplemented('getFirstProject');
  }
  getFirstTarget(..._args: any[]): any {
    notImplemented('getFirstTarget');
  }
  getTarget(..._args: any[]): any {
    notImplemented('getTarget');
  }
  getPBXGroupByKey(..._args: any[]): any {
    notImplemented('getPBXGroupByKey');
  }
  getPBXGroupByKeyAndType(..._args: any[]): any {
    notImplemented('getPBXGroupByKeyAndType');
  }
  getPBXVariantGroupByKey(..._args: any[]): any {
    notImplemented('getPBXVariantGroupByKey');
  }
  pbxTargetByName(..._args: any[]): any {
    notImplemented('pbxTargetByName');
  }
  pbxItemByComment(..._args: any[]): any {
    notImplemented('pbxItemByComment');
  }
  findTargetKey(..._args: any[]): any {
    notImplemented('findTargetKey');
  }
  findPBXGroupKey(..._args: any[]): any {
    notImplemented('findPBXGroupKey');
  }
  findPBXGroupKeyAndType(..._args: any[]): any {
    notImplemented('findPBXGroupKeyAndType');
  }
  getPBXObject(..._args: any[]): any {
    notImplemented('getPBXObject');
  }
  hasFile(..._args: any[]): any {
    notImplemented('hasFile');
  }
  getBuildProperty(..._args: any[]): any {
    notImplemented('getBuildProperty');
  }
  getBuildConfigByName(..._args: any[]): any {
    notImplemented('getBuildConfigByName');
  }
  get productName(): any {
    return notImplemented('productName');
  }

  // === Mutate: build settings ===

  addBuildProperty(..._args: any[]): any {
    notImplemented('addBuildProperty');
  }
  removeBuildProperty(..._args: any[]): any {
    notImplemented('removeBuildProperty');
  }
  updateBuildProperty(..._args: any[]): any {
    notImplemented('updateBuildProperty');
  }
  updateProductName(..._args: any[]): any {
    notImplemented('updateProductName');
  }
  addToBuildSettings(..._args: any[]): any {
    notImplemented('addToBuildSettings');
  }
  removeFromBuildSettings(..._args: any[]): any {
    notImplemented('removeFromBuildSettings');
  }
  addToHeaderSearchPaths(..._args: any[]): any {
    notImplemented('addToHeaderSearchPaths');
  }
  removeFromHeaderSearchPaths(..._args: any[]): any {
    notImplemented('removeFromHeaderSearchPaths');
  }
  addToLibrarySearchPaths(..._args: any[]): any {
    notImplemented('addToLibrarySearchPaths');
  }
  removeFromLibrarySearchPaths(..._args: any[]): any {
    notImplemented('removeFromLibrarySearchPaths');
  }
  addToFrameworkSearchPaths(..._args: any[]): any {
    notImplemented('addToFrameworkSearchPaths');
  }
  removeFromFrameworkSearchPaths(..._args: any[]): any {
    notImplemented('removeFromFrameworkSearchPaths');
  }
  addToOtherLinkerFlags(..._args: any[]): any {
    notImplemented('addToOtherLinkerFlags');
  }
  removeFromOtherLinkerFlags(..._args: any[]): any {
    notImplemented('removeFromOtherLinkerFlags');
  }

  // === Mutate: sections ===

  addToPbxFileReferenceSection(..._args: any[]): any {
    notImplemented('addToPbxFileReferenceSection');
  }
  removeFromPbxFileReferenceSection(..._args: any[]): any {
    notImplemented('removeFromPbxFileReferenceSection');
  }
  addToPbxBuildFileSection(..._args: any[]): any {
    notImplemented('addToPbxBuildFileSection');
  }
  removeFromPbxBuildFileSection(..._args: any[]): any {
    notImplemented('removeFromPbxBuildFileSection');
  }
  addToPbxProjectSection(..._args: any[]): any {
    notImplemented('addToPbxProjectSection');
  }
  addToPbxNativeTargetSection(..._args: any[]): any {
    notImplemented('addToPbxNativeTargetSection');
  }
  addToXcVersionGroupSection(..._args: any[]): any {
    notImplemented('addToXcVersionGroupSection');
  }

  // === Mutate: build phases ===

  addToPbxResourcesBuildPhase(..._args: any[]): any {
    notImplemented('addToPbxResourcesBuildPhase');
  }
  removeFromPbxResourcesBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxResourcesBuildPhase');
  }
  addToPbxSourcesBuildPhase(..._args: any[]): any {
    notImplemented('addToPbxSourcesBuildPhase');
  }
  removeFromPbxSourcesBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxSourcesBuildPhase');
  }
  addToPbxFrameworksBuildPhase(..._args: any[]): any {
    notImplemented('addToPbxFrameworksBuildPhase');
  }
  removeFromPbxFrameworksBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxFrameworksBuildPhase');
  }
  addToPbxEmbedFrameworksBuildPhase(..._args: any[]): any {
    notImplemented('addToPbxEmbedFrameworksBuildPhase');
  }
  removeFromPbxEmbedFrameworksBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxEmbedFrameworksBuildPhase');
  }
  addToPbxCopyfilesBuildPhase(..._args: any[]): any {
    notImplemented('addToPbxCopyfilesBuildPhase');
  }
  removeFromPbxCopyfilesBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxCopyfilesBuildPhase');
  }
  addBuildPhase(..._args: any[]): any {
    notImplemented('addBuildPhase');
  }

  // === Mutate: groups ===

  pbxCreateGroup(..._args: any[]): any {
    notImplemented('pbxCreateGroup');
  }
  pbxCreateGroupWithType(..._args: any[]): any {
    notImplemented('pbxCreateGroupWithType');
  }
  pbxCreateVariantGroup(..._args: any[]): any {
    notImplemented('pbxCreateVariantGroup');
  }
  addPbxGroup(..._args: any[]): any {
    notImplemented('addPbxGroup');
  }
  removePbxGroup(..._args: any[]): any {
    notImplemented('removePbxGroup');
  }
  addToPbxGroup(..._args: any[]): any {
    notImplemented('addToPbxGroup');
  }
  addToPbxGroupType(..._args: any[]): any {
    notImplemented('addToPbxGroupType');
  }
  addToPbxVariantGroup(..._args: any[]): any {
    notImplemented('addToPbxVariantGroup');
  }
  removeFromPbxGroup(..._args: any[]): any {
    notImplemented('removeFromPbxGroup');
  }
  removeFromPbxGroupAndType(..._args: any[]): any {
    notImplemented('removeFromPbxGroupAndType');
  }

  // === Mutate: frameworks / files ===

  addFramework(..._args: any[]): any {
    notImplemented('addFramework');
  }
  removeFramework(..._args: any[]): any {
    notImplemented('removeFramework');
  }
  addToFrameworksPbxGroup(..._args: any[]): any {
    notImplemented('addToFrameworksPbxGroup');
  }
  addFile(..._args: any[]): any {
    notImplemented('addFile');
  }
  removeFile(..._args: any[]): any {
    notImplemented('removeFile');
  }
  addSourceFile(..._args: any[]): any {
    notImplemented('addSourceFile');
  }
  removeSourceFile(..._args: any[]): any {
    notImplemented('removeSourceFile');
  }
  addResourceFile(..._args: any[]): any {
    notImplemented('addResourceFile');
  }
  removeResourceFile(..._args: any[]): any {
    notImplemented('removeResourceFile');
  }
  addStaticLibrary(..._args: any[]): any {
    notImplemented('addStaticLibrary');
  }
  addCopyfile(..._args: any[]): any {
    notImplemented('addCopyfile');
  }

  // === Mutate: targets ===

  addTarget(..._args: any[]): any {
    notImplemented('addTarget');
  }
  addTargetDependency(..._args: any[]): any {
    notImplemented('addTargetDependency');
  }
  addXCConfigurationList(..._args: any[]): any {
    notImplemented('addXCConfigurationList');
  }
  addProductFile(..._args: any[]): any {
    notImplemented('addProductFile');
  }
  removeProductFile(..._args: any[]): any {
    notImplemented('removeProductFile');
  }
  addToProductsPbxGroup(..._args: any[]): any {
    notImplemented('addToProductsPbxGroup');
  }
  addTargetAttribute(..._args: any[]): any {
    notImplemented('addTargetAttribute');
  }
  removeTargetAttribute(..._args: any[]): any {
    notImplemented('removeTargetAttribute');
  }

  // === Mutate: regions / variant groups ===

  addKnownRegion(..._args: any[]): any {
    notImplemented('addKnownRegion');
  }
  removeKnownRegion(..._args: any[]): any {
    notImplemented('removeKnownRegion');
  }
  hasKnownRegion(..._args: any[]): any {
    notImplemented('hasKnownRegion');
  }
  addLocalizationVariantGroup(..._args: any[]): any {
    notImplemented('addLocalizationVariantGroup');
  }
}
