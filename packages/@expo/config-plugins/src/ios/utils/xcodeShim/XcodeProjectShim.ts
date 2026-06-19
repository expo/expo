import { XcodeProject } from '@bacons/xcode';
import { build } from '@bacons/xcode/json';
import path from 'path';

import { legacyRefArray } from './legacyRefArray';
import { PbxFile } from './pbxFile';

function notImplemented(method: string): never {
  throw new Error(`XcodeProjectShim.${method} is not implemented yet`);
}

function trimQuotes(value: string): string {
  return value.replace(/^"(.*)"$/, '$1');
}

// Legacy callers pass values verbatim-quoted (e.g. `'"com.example"'`).
// `@bacons` stores values unquoted and re-quotes at serialize, so strip one
// layer of outer quotes on write to avoid double-quoting.
function unquoteForWrite(value: any): any {
  return typeof value === 'string' ? trimQuotes(value) : value;
}

// `$(inherited)`, stored unquoted (`@bacons` re-quotes at serialize).
const INHERITED = '$(inherited)';

// Copy-files phase destination lookups, ported from legacy `xcode`.
const DESTINATION_BY_TARGETTYPE: Record<string, string> = {
  application: 'wrapper',
  app_extension: 'plugins',
  bundle: 'wrapper',
  command_line_tool: 'wrapper',
  dynamic_library: 'products_directory',
  framework: 'shared_frameworks',
  frameworks: 'frameworks',
  static_library: 'products_directory',
  unit_test_bundle: 'wrapper',
  watch_app: 'wrapper',
  watch2_app: 'products_directory',
  watch_extension: 'plugins',
  watch2_extension: 'plugins',
};
const SUBFOLDERSPEC_BY_DESTINATION: Record<string, number> = {
  absolute_path: 0,
  executables: 6,
  frameworks: 10,
  java_resources: 15,
  plugins: 13,
  products_directory: 16,
  resources: 7,
  shared_frameworks: 11,
  shared_support: 12,
  wrapper: 1,
  xpc_services: 0,
};

function copyFilesPhaseProps(folderType: string, subfolderPath: string | undefined, name: string) {
  return {
    name,
    dstPath: subfolderPath ? trimQuotes(subfolderPath) : '',
    dstSubfolderSpec: SUBFOLDERSPEC_BY_DESTINATION[DESTINATION_BY_TARGETTYPE[folderType] ?? ''],
  };
}

function shellScriptPhaseProps(options: any, name: string) {
  // Stored unquoted; `@bacons` escapes/quotes the script and re-quotes the paths
  // at serialize (legacy stores paths verbatim and never quotes them).
  return {
    name,
    inputPaths: (options.inputPaths || []).map(unquoteForWrite),
    outputPaths: (options.outputPaths || []).map(unquoteForWrite),
    shellPath: options.shellPath,
    shellScript: options.shellScript,
  };
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

  private models(): any[] {
    return [...this.inner.values()];
  }

  private modelsOfIsa(isa: string): any[] {
    return this.models().filter((model) => model.isa === isa);
  }

  private findTargetByName(name: string): any | null {
    return (
      this.modelsOfIsa('PBXNativeTarget').find((t) => trimQuotes(t.props.name) === name) ?? null
    );
  }

  /** UUIDs of the build configurations belonging to a target's configuration list. */
  private configUuidsForTarget(target: any): Set<string> {
    const configs = target?.props?.buildConfigurationList?.props?.buildConfigurations ?? [];
    return new Set<string>(configs.map((config: any) => config.uuid));
  }

  // `@bacons`'s getObject throws on miss; legacy returns null/undefined.
  private safeGetObject(uuid: string): any {
    try {
      return this.inner.getObject(uuid);
    } catch {
      return undefined;
    }
  }

  /** Legacy-shaped view of a group: references as UUIDs, `children` as a live array. */
  private legacyGroup(model: any): any {
    const project = this.inner;
    return {
      uuid: model.uuid,
      isa: model.isa,
      name: model.props.name,
      path: model.props.path,
      sourceTree: model.props.sourceTree,
      get children() {
        return legacyRefArray(model.props.children, project);
      },
    };
  }

  // `createObject` builds a model with a caller-chosen uuid but does not register
  // it; `set` adds it to the project so it serializes. Undefined fields are
  // dropped so the shim never emits `= undefined`.
  private createObjectWithUuid(uuid: string, json: Record<string, any>): any {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(json)) {
      if (value !== undefined) clean[key] = value;
    }
    const model = this.inner.createObject(uuid, clean as any);
    this.inner.set(uuid, model);
    return model;
  }

  private firstTargetModel(): any {
    return this.inner.rootObject.props.targets[0];
  }

  /** Legacy-shaped view of a native target: references as UUIDs. */
  private legacyTarget(model: any): any {
    return {
      uuid: model.uuid,
      isa: model.isa,
      name: model.props.name,
      productName: model.props.productName,
      productType: model.props.productType,
      buildConfigurationList: model.props.buildConfigurationList?.uuid,
    };
  }

  private buildPhaseForTarget(isa: string, targetUuid?: string): any {
    const target = (targetUuid && this.safeGetObject(targetUuid)) || this.firstTargetModel();
    return (target?.props?.buildPhases ?? []).find((phase: any) => phase.isa === isa);
  }

  /** Legacy-shaped view of a build phase: scalars pass through, `files` is a live array. */
  private legacyBuildPhase(model: any): any {
    const project = this.inner;
    const props = model.props;
    return {
      uuid: model.uuid,
      isa: model.isa,
      name: props.name,
      buildActionMask: props.buildActionMask,
      runOnlyForDeploymentPostprocessing: props.runOnlyForDeploymentPostprocessing,
      shellPath: props.shellPath,
      shellScript: props.shellScript,
      inputPaths: props.inputPaths,
      outputPaths: props.outputPaths,
      dstPath: props.dstPath,
      dstSubfolderSpec: props.dstSubfolderSpec,
      get files() {
        return legacyRefArray(props.files, project);
      },
    };
  }

  // Append a build file to a target's phase. A missing build file (e.g. a file
  // added without a PBXBuildFile) is skipped rather than linked as a dangling ref.
  private addBuildFileToPhase(isa: string, file: any): void {
    const buildFile = this.safeGetObject(file.uuid);
    if (!buildFile) return;
    this.buildPhaseForTarget(isa, file.target).props.files.push(buildFile);
  }

  // Append a value to an array-valued build setting, on the configs of the app
  // target (legacy scopes these to configs whose PRODUCT_NAME is the productName).
  private appendScopedArraySetting(key: string, value: any): void {
    const productName = this.productName;
    for (const config of this.modelsOfIsa('XCBuildConfiguration')) {
      const buildSettings = config.props.buildSettings;
      if (trimQuotes(buildSettings.PRODUCT_NAME ?? '') !== productName) continue;
      if (!buildSettings[key] || buildSettings[key] === INHERITED) {
        buildSettings[key] = [INHERITED];
      }
      buildSettings[key].push(unquoteForWrite(value));
    }
  }

  /** Legacy section dict: `{ uuid: object, uuid_comment: name }` for each model of an isa. */
  private legacySection(isa: string): Record<string, any> {
    const section: Record<string, any> = {};
    for (const model of this.modelsOfIsa(isa)) {
      section[model.uuid] = model.props;
      section[`${model.uuid}_comment`] = model.getDisplayName?.() ?? model.uuid;
    }
    return section;
  }

  /** Legacy-shaped view of the root project: references as UUIDs, `targets` as a live array. */
  private legacyProject(): any {
    const project = this.inner;
    const props = this.inner.rootObject.props;
    return {
      mainGroup: props.mainGroup?.uuid,
      productRefGroup: props.productRefGroup?.uuid,
      buildConfigurationList: props.buildConfigurationList?.uuid,
      knownRegions: props.knownRegions,
      attributes: props.attributes,
      compatibilityVersion: props.compatibilityVersion,
      developmentRegion: props.developmentRegion,
      get targets() {
        return legacyRefArray(props.targets, project);
      },
    };
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

  generateUuid(): string {
    let id: string;
    do {
      id = '';
      for (let i = 0; i < 24; i++) id += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
    } while (this.inner.has(id));
    return id;
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
  pbxFileReferenceSection(): any {
    return this.legacySection('PBXFileReference');
  }
  pbxBuildFileSection(): any {
    return this.legacySection('PBXBuildFile');
  }
  xcVersionGroupSection(..._args: any[]): any {
    notImplemented('xcVersionGroupSection');
  }
  pbxGroupByName(name: string): any {
    const model = this.modelsOfIsa('PBXGroup').find((g) => g.getDisplayName() === name);
    return model ? this.legacyGroup(model) : null;
  }
  pbxResourcesBuildPhaseObj(target?: string): any {
    return this.buildPhaseObject('PBXResourcesBuildPhase', 'Resources', target);
  }
  pbxSourcesBuildPhaseObj(target?: string): any {
    return this.buildPhaseObject('PBXSourcesBuildPhase', 'Sources', target);
  }
  pbxFrameworksBuildPhaseObj(target?: string): any {
    return this.buildPhaseObject('PBXFrameworksBuildPhase', 'Frameworks', target);
  }
  pbxEmbedFrameworksBuildPhaseObj(target?: string): any {
    return this.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed Frameworks', target);
  }
  pbxCopyfilesBuildPhaseObj(target?: string): any {
    return this.buildPhaseObject('PBXCopyFilesBuildPhase', 'Copy Files', target);
  }
  buildPhase(..._args: any[]): any {
    notImplemented('buildPhase');
  }
  buildPhaseObject(isa: string, name: string, target?: string): any {
    const targetModel = (target && this.safeGetObject(target)) || this.firstTargetModel();
    // Unnamed built-in phases (Sources/Frameworks/Resources) match by isa; named
    // phases (copy-files, shell scripts) disambiguate by name.
    const phase = (targetModel?.props?.buildPhases ?? []).find(
      (p: any) => p.isa === isa && (p.props.name == null || trimQuotes(p.props.name) === name)
    );
    return phase ? this.legacyBuildPhase(phase) : null;
  }
  getFirstProject(): any {
    return { uuid: this.inner.rootObject.uuid, firstProject: this.legacyProject() };
  }
  getFirstTarget(): any {
    const model = this.firstTargetModel();
    return { uuid: model.uuid, firstTarget: this.legacyTarget(model) };
  }
  getTarget(productType: string): any {
    const model = this.modelsOfIsa('PBXNativeTarget').find(
      (t) => trimQuotes(t.props.productType) === productType
    );
    return model ? { uuid: model.uuid, target: this.legacyTarget(model) } : null;
  }
  getPBXGroupByKey(key: string): any {
    const model = this.safeGetObject(key);
    return model && model.isa === 'PBXGroup' ? this.legacyGroup(model) : undefined;
  }
  getPBXGroupByKeyAndType(key: string, groupType: string): any {
    const model = this.safeGetObject(key);
    return model && model.isa === groupType ? this.legacyGroup(model) : undefined;
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
  hasFile(filePath: string): any {
    for (const ref of this.modelsOfIsa('PBXFileReference')) {
      if (trimQuotes(ref.props.path) === filePath) {
        return ref;
      }
    }
    return false;
  }
  getBuildProperty(prop: string, build?: string, targetName?: string): any {
    const scoped = targetName ? this.configUuidsForTarget(this.findTargetByName(targetName)) : null;
    let result: any;
    for (const config of this.modelsOfIsa('XCBuildConfiguration')) {
      if (scoped && !scoped.has(config.uuid)) continue;
      if (build === undefined || config.props.name === build) {
        if (config.props.buildSettings[prop] !== undefined) {
          result = config.props.buildSettings[prop];
        }
      }
    }
    return result;
  }
  getBuildConfigByName(..._args: any[]): any {
    notImplemented('getBuildConfigByName');
  }
  get productName(): any {
    for (const config of this.modelsOfIsa('XCBuildConfiguration')) {
      const name = config.props.buildSettings.PRODUCT_NAME;
      if (name) return trimQuotes(name);
    }
    return undefined;
  }

  // === Mutate: build settings ===

  addBuildProperty(prop: string, value: any, buildName?: string): void {
    for (const config of this.modelsOfIsa('XCBuildConfiguration')) {
      if (!buildName || config.props.name === buildName) {
        config.props.buildSettings[prop] = unquoteForWrite(value);
      }
    }
  }

  removeBuildProperty(prop: string, buildName?: string): void {
    for (const config of this.modelsOfIsa('XCBuildConfiguration')) {
      if (!buildName || config.props.name === buildName) {
        delete config.props.buildSettings[prop];
      }
    }
  }

  updateBuildProperty(prop: string, value: any, build?: string | null, targetName?: string): void {
    const scoped = targetName ? this.configUuidsForTarget(this.findTargetByName(targetName)) : null;
    for (const config of this.modelsOfIsa('XCBuildConfiguration')) {
      if (scoped && !scoped.has(config.uuid)) continue;
      if (!build || config.props.name === build) {
        config.props.buildSettings[prop] = unquoteForWrite(value);
      }
    }
  }

  updateProductName(name: string): void {
    this.updateBuildProperty('PRODUCT_NAME', name);
  }
  addToBuildSettings(..._args: any[]): any {
    notImplemented('addToBuildSettings');
  }
  removeFromBuildSettings(..._args: any[]): any {
    notImplemented('removeFromBuildSettings');
  }
  addToHeaderSearchPaths(file: any): void {
    this.appendScopedArraySetting('HEADER_SEARCH_PATHS', file);
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
  addToOtherLinkerFlags(flag: any): void {
    this.appendScopedArraySetting('OTHER_LDFLAGS', flag);
  }
  removeFromOtherLinkerFlags(..._args: any[]): any {
    notImplemented('removeFromOtherLinkerFlags');
  }

  // === Mutate: sections ===

  addToPbxFileReferenceSection(file: any): void {
    this.createObjectWithUuid(file.fileRef, {
      isa: 'PBXFileReference',
      name: file.basename,
      path: file.path,
      sourceTree: unquoteForWrite(file.sourceTree),
      fileEncoding: file.fileEncoding,
      lastKnownFileType: file.lastKnownFileType,
      explicitFileType: unquoteForWrite(file.explicitFileType),
      includeInIndex: file.includeInIndex,
    });
  }
  removeFromPbxFileReferenceSection(..._args: any[]): any {
    notImplemented('removeFromPbxFileReferenceSection');
  }
  addToPbxBuildFileSection(file: any): void {
    this.createObjectWithUuid(file.uuid, {
      isa: 'PBXBuildFile',
      fileRef: this.inner.getObject(file.fileRef),
      settings: file.settings,
    });
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

  addToPbxResourcesBuildPhase(file: any): void {
    this.addBuildFileToPhase('PBXResourcesBuildPhase', file);
  }
  removeFromPbxResourcesBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxResourcesBuildPhase');
  }
  addToPbxSourcesBuildPhase(file: any): void {
    this.addBuildFileToPhase('PBXSourcesBuildPhase', file);
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
  addBuildPhase(
    filePathsArray: string[],
    buildPhaseType: string,
    comment: string,
    target?: string,
    optionsOrFolderType?: any,
    subfolderPath?: string
  ): any {
    const targetModel = (target && this.safeGetObject(target)) || this.firstTargetModel();

    let extra: Record<string, any> = {};
    if (buildPhaseType === 'PBXCopyFilesBuildPhase') {
      extra = copyFilesPhaseProps(optionsOrFolderType, subfolderPath, comment);
    } else if (buildPhaseType === 'PBXShellScriptBuildPhase') {
      extra = shellScriptPhaseProps(optionsOrFolderType, comment);
    }

    const phase = this.createObjectWithUuid(this.generateUuid(), {
      isa: buildPhaseType,
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
      ...extra,
    });
    targetModel.props.buildPhases.push(phase);

    for (const filePath of filePathsArray) {
      const existing = this.modelsOfIsa('PBXBuildFile').find(
        (bf) => bf.props.fileRef?.props?.path === filePath
      );
      if (existing) {
        phase.props.files.push(existing);
        continue;
      }
      const file = new PbxFile(filePath);
      file.uuid = this.generateUuid();
      file.fileRef = this.generateUuid();
      this.addToPbxFileReferenceSection(file);
      this.addToPbxBuildFileSection(file);
      phase.props.files.push(this.inner.getObject(file.uuid));
    }

    return { uuid: phase.uuid, buildPhase: this.legacyBuildPhase(phase) };
  }

  // === Mutate: groups ===

  pbxCreateGroup(name: string, pathName?: string): string {
    return this.pbxCreateGroupWithType(name, pathName, 'PBXGroup');
  }
  pbxCreateGroupWithType(name: string, pathName: string | undefined, groupType: string): string {
    const opts: any = { isa: groupType, name, children: [], sourceTree: '<group>' };
    if (pathName) opts.path = unquoteForWrite(pathName);
    return this.inner.createModel(opts).uuid;
  }
  pbxCreateVariantGroup(..._args: any[]): any {
    notImplemented('pbxCreateVariantGroup');
  }
  addPbxGroup(
    filePathsArray: string[],
    name?: string,
    groupPath?: string,
    sourceTree?: string
  ): any {
    const existing = new Map<string, any>();
    for (const ref of this.modelsOfIsa('PBXFileReference')) existing.set(ref.props.path, ref);

    const group = this.createObjectWithUuid(this.generateUuid(), {
      isa: 'PBXGroup',
      children: [],
      name,
      path: groupPath,
      sourceTree: sourceTree ? unquoteForWrite(sourceTree) : '<group>',
    });

    for (const filePath of filePathsArray) {
      const found = existing.get(filePath) ?? existing.get(`"${filePath}"`);
      if (found) {
        group.props.children.push(found);
        continue;
      }
      const file = new PbxFile(filePath);
      file.uuid = this.generateUuid();
      file.fileRef = this.generateUuid();
      this.addToPbxFileReferenceSection(file);
      this.addToPbxBuildFileSection(file);
      group.props.children.push(this.inner.getObject(file.fileRef));
    }

    return { uuid: group.uuid, pbxGroup: this.legacyGroup(group) };
  }
  removePbxGroup(..._args: any[]): any {
    notImplemented('removePbxGroup');
  }
  addToPbxGroup(file: any, groupKey: string): void {
    this.addToPbxGroupType(file, groupKey, 'PBXGroup');
  }
  addToPbxGroupType(file: any, groupKey: string, groupType: string): void {
    const group = this.getPBXGroupByKeyAndType(groupKey, groupType);
    if (!group?.children) return;
    if (typeof file === 'string') {
      const child = this.safeGetObject(file);
      group.children.push({ value: file, comment: child?.getDisplayName?.() ?? file });
    } else {
      group.children.push({ value: file.fileRef, comment: file.basename });
    }
  }
  addToPbxVariantGroup(file: any, groupKey: string): void {
    this.addToPbxGroupType(file, groupKey, 'PBXVariantGroup');
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

  addKnownRegion(name: string): void {
    const props = this.inner.rootObject.props;
    if (!props.knownRegions) props.knownRegions = [];
    if (!this.hasKnownRegion(name)) props.knownRegions.push(name);
  }
  removeKnownRegion(..._args: any[]): any {
    notImplemented('removeKnownRegion');
  }
  hasKnownRegion(name: string): boolean {
    return (this.inner.rootObject.props.knownRegions ?? []).includes(name);
  }
  addLocalizationVariantGroup(..._args: any[]): any {
    notImplemented('addLocalizationVariantGroup');
  }
}
