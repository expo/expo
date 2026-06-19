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

// Re-quote a value on read the way pbxproj serialization would, so reads
// reproduce legacy's verbatim (quoted) form — plugins that compare against
// quoted strings (e.g. `productType === '"…application"'`) keep working. Mirrors
// `@bacons`'s `ensureQuotes` (hyphen is NOT a safe char, so product types quote).
function quoteForRead(value: any): any {
  if (typeof value !== 'string') return value;
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return /^[\w$/:.]+$/.test(escaped) ? escaped : `"${escaped}"`;
}

// Array-valued build settings written directly (e.g. HEADER_SEARCH_PATHS) are
// unquoted on push/index-set so `@bacons` doesn't double-quote pre-quoted entries.
function unquotingArray(arr: any[]): any[] {
  return new Proxy(arr, {
    get(target, prop) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        return quoteForRead(target[Number(prop)]);
      }
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        target[Number(prop)] = unquoteForWrite(value);
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  });
}

// Build settings written directly through a section view (bypassing
// addBuildProperty) are unquoted so `@bacons` doesn't double-quote. Scalar and
// array-element assignments are unquoted, and array reads return an unquoting
// view so later `.push(...)` of quoted values is normalized too.
function buildSettingsProxy(buildSettings: Record<string, any>): Record<string, any> {
  return new Proxy(buildSettings, {
    get(target, key) {
      const value = target[key as string];
      if (Array.isArray(value)) return unquotingArray(value);
      return typeof value === 'string' ? quoteForRead(value) : value;
    },
    set(target, key, value) {
      if (typeof key !== 'string') {
        target[key as any] = value;
      } else {
        target[key] = Array.isArray(value) ? value.map(unquoteForWrite) : unquoteForWrite(value);
      }
      return true;
    },
  });
}

// Object fields that hold arrays of references (even when currently empty).
const REF_ARRAY_FIELDS = new Set([
  'children',
  'files',
  'buildPhases',
  'dependencies',
  'buildConfigurations',
  'buildRules',
  'targets',
]);

// Define a legacy-shaped ref-array property with both get (live view) and set
// (wholesale reassignment, which legacy plugins do e.g. `group.children = [...]`).
function defineLiveRefArray(view: any, key: string, backing: any[], project: XcodeProject): void {
  Object.defineProperty(view, key, {
    enumerable: true,
    configurable: true,
    get() {
      return legacyRefArray(backing, project);
    },
    set(entries: any[]) {
      backing.length = 0;
      const arr = legacyRefArray(backing, project);
      for (const entry of entries ?? []) arr.push(entry);
    },
  });
}

// Strip outer quotes from build-setting values (and array elements) on write.
function unquoteBuildSettings(buildSettings: Record<string, any> = {}): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(buildSettings)) {
    out[key] = Array.isArray(value) ? value.map(unquoteForWrite) : unquoteForWrite(value);
  }
  return out;
}

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

const PRODUCTTYPE_BY_TARGETTYPE: Record<string, string> = {
  application: 'com.apple.product-type.application',
  app_extension: 'com.apple.product-type.app-extension',
  bundle: 'com.apple.product-type.bundle',
  command_line_tool: 'com.apple.product-type.tool',
  dynamic_library: 'com.apple.product-type.library.dynamic',
  framework: 'com.apple.product-type.framework',
  static_library: 'com.apple.product-type.library.static',
  unit_test_bundle: 'com.apple.product-type.bundle.unit-test',
  watch_app: 'com.apple.product-type.application.watchapp',
  watch2_app: 'com.apple.product-type.application.watchapp2',
  watch_extension: 'com.apple.product-type.watchkit-extension',
  watch2_extension: 'com.apple.product-type.watchkit2-extension',
};
const FILETYPE_BY_PRODUCTTYPE: Record<string, string> = {
  'com.apple.product-type.application': '"wrapper.application"',
  'com.apple.product-type.app-extension': '"wrapper.app-extension"',
  'com.apple.product-type.bundle': '"wrapper.plug-in"',
  'com.apple.product-type.tool': '"compiled.mach-o.dylib"',
  'com.apple.product-type.library.dynamic': '"compiled.mach-o.dylib"',
  'com.apple.product-type.framework': '"wrapper.framework"',
  'com.apple.product-type.library.static': '"archive.ar"',
  'com.apple.product-type.bundle.unit-test': '"wrapper.cfbundle"',
  'com.apple.product-type.application.watchapp': '"wrapper.application"',
  'com.apple.product-type.application.watchapp2': '"wrapper.application"',
  'com.apple.product-type.watchkit-extension': '"wrapper.app-extension"',
  'com.apple.product-type.watchkit2-extension': '"wrapper.app-extension"',
};

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

  // ISAs whose section was explicitly created via `hash.project.objects[ISA] = …`
  // (legacy treats a present-but-empty section as existing; the typed model has
  // no empty sections, so track them here).
  private hashCreatedSections = new Set<string>();

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
    const view: any = {
      uuid: model.uuid,
      isa: model.isa,
      name: quoteForRead(model.props.name),
      path: quoteForRead(model.props.path),
      sourceTree: quoteForRead(model.props.sourceTree),
    };
    defineLiveRefArray(view, 'children', model.props.children, this.inner);
    return view;
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

  /** Legacy-shaped view of a native target: references as UUIDs, ref arrays live. */
  private legacyTarget(model: any): any {
    const props = model.props;
    const view: any = {
      uuid: model.uuid,
      isa: model.isa,
      name: quoteForRead(props.name),
      productName: quoteForRead(props.productName),
      productType: quoteForRead(props.productType),
      buildConfigurationList: props.buildConfigurationList?.uuid,
    };
    defineLiveRefArray(view, 'dependencies', props.dependencies, this.inner);
    defineLiveRefArray(view, 'buildPhases', props.buildPhases, this.inner);
    return view;
  }

  private targetModel(targetUuid?: string): any {
    return (targetUuid && this.safeGetObject(targetUuid)) || this.firstTargetModel();
  }

  private buildPhaseForTarget(isa: string, targetUuid?: string): any {
    return (this.targetModel(targetUuid)?.props?.buildPhases ?? []).find(
      (phase: any) => phase.isa === isa
    );
  }

  /** Legacy-shaped view of a build phase: scalars pass through, `files` is a live array. */
  private legacyBuildPhase(model: any): any {
    const props = model.props;
    const view: any = {
      uuid: model.uuid,
      isa: model.isa,
      name: quoteForRead(props.name),
      buildActionMask: props.buildActionMask,
      runOnlyForDeploymentPostprocessing: props.runOnlyForDeploymentPostprocessing,
      shellPath: quoteForRead(props.shellPath),
      shellScript: quoteForRead(props.shellScript),
      inputPaths: Array.isArray(props.inputPaths)
        ? props.inputPaths.map(quoteForRead)
        : props.inputPaths,
      outputPaths: Array.isArray(props.outputPaths)
        ? props.outputPaths.map(quoteForRead)
        : props.outputPaths,
      dstPath: quoteForRead(props.dstPath),
      dstSubfolderSpec: props.dstSubfolderSpec,
    };
    defineLiveRefArray(view, 'files', props.files, this.inner);
    return view;
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

  /** Legacy-shaped view of an XCConfigurationList: `buildConfigurations` as a live array. */
  private legacyConfigList(model: any): any {
    const props = model.props;
    const view: any = {
      uuid: model.uuid,
      isa: model.isa,
      defaultConfigurationName: quoteForRead(props.defaultConfigurationName),
      defaultConfigurationIsVisible: props.defaultConfigurationIsVisible,
    };
    defineLiveRefArray(view, 'buildConfigurations', props.buildConfigurations, this.inner);
    return view;
  }

  // Live legacy-shaped view of one object's props. Fields are read+write-through
  // so plugins that mutate the object obtained from a section (e.g.
  // `target.buildConfigurationList = uuid`) reach the model: references read as
  // UUIDs / write by resolving, ref arrays are live `{ value, comment }` arrays,
  // `buildSettings` is an unquoting Proxy, and scalars read-quote / write-unquote.
  private toLegacyObject(model: any): any {
    const self = this;
    const props = model.props;
    const out: Record<string, any> = {};
    for (const key of Object.keys(props)) {
      const value = props[key];
      if (key === 'buildSettings' && value && typeof value === 'object' && !Array.isArray(value)) {
        out[key] = buildSettingsProxy(value);
      } else if (
        Array.isArray(value) &&
        (REF_ARRAY_FIELDS.has(key) ||
          (value.length > 0 && value.every((v) => v && typeof v.uuid === 'string')))
      ) {
        defineLiveRefArray(out, key, value, this.inner);
      } else if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof value.uuid === 'string'
      ) {
        Object.defineProperty(out, key, {
          enumerable: true,
          configurable: true,
          get: () => props[key]?.uuid,
          set: (v) => {
            props[key] = self.resolveRef(v);
          },
        });
      } else {
        Object.defineProperty(out, key, {
          enumerable: true,
          configurable: true,
          get: () => quoteForRead(props[key]),
          set: (v) => {
            props[key] = typeof v === 'string' ? unquoteForWrite(v) : v;
          },
        });
      }
    }
    return out;
  }

  // Resolve a reference assignment to a model (or a stand-in relinked at write).
  private resolveRef(value: any): any {
    if (value && typeof value === 'object') return value;
    const uuid = trimQuotes(String(value));
    return this.safeGetObject(uuid) ?? { uuid };
  }

  /** Legacy section dict: `{ uuid: object, uuid_comment: name }` for each model of an isa. */
  private legacySection(isa: string): Record<string, any> {
    const section: Record<string, any> = {};
    for (const model of this.modelsOfIsa(isa)) {
      section[model.uuid] = this.toLegacyObject(model);
      section[`${model.uuid}_comment`] = model.getDisplayName?.() ?? model.uuid;
    }
    return section;
  }

  private sectionExists(isa: string): boolean {
    return this.modelsOfIsa(isa).length > 0 || this.hashCreatedSections.has(isa);
  }

  // Create a model from a legacy-shaped plain object written via the hash bridge
  // (`objects[ISA][uuid] = obj`): resolve uuid-string ref fields to model
  // instances and unquote values, then register it.
  private createFromLegacyObject(uuid: string, obj: any): void {
    if (!obj || typeof obj !== 'object' || this.safeGetObject(uuid)) return;
    const resolveMaybeRef = (v: any) =>
      typeof v === 'string' ? (this.safeGetObject(trimQuotes(v)) ?? unquoteForWrite(v)) : v;
    const json: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.endsWith('_comment')) continue;
      if (key === 'buildSettings' && value && typeof value === 'object' && !Array.isArray(value)) {
        json[key] = unquoteBuildSettings(value as Record<string, any>);
      } else if (Array.isArray(value)) {
        json[key] = value.map(resolveMaybeRef);
      } else {
        json[key] = resolveMaybeRef(value);
      }
    }
    this.createObjectWithUuid(uuid, json);
  }

  // A live, read-write `hash.project.objects[ISA]` section: reads project the
  // models (`{ uuid: object, uuid_comment }`); writes create models.
  private hashSection(isa: string): any {
    const self = this;
    return new Proxy(
      {},
      {
        get(_t, key) {
          if (typeof key !== 'string') return undefined;
          if (key.endsWith('_comment')) {
            return self.safeGetObject(key.slice(0, -'_comment'.length))?.getDisplayName?.();
          }
          const model = self.safeGetObject(key);
          return model && model.isa === isa ? self.toLegacyObject(model) : undefined;
        },
        set(_t, key, value) {
          if (typeof key === 'string' && !key.endsWith('_comment')) {
            self.createFromLegacyObject(key, value);
          }
          return true;
        },
        ownKeys() {
          return self.modelsOfIsa(isa).flatMap((m) => [m.uuid, `${m.uuid}_comment`]);
        },
        getOwnPropertyDescriptor() {
          return { enumerable: true, configurable: true };
        },
      }
    );
  }

  /** Legacy-shaped view of the root project: references as UUIDs, `targets` as a live array. */
  private legacyProject(): any {
    const props = this.inner.rootObject.props;
    const view: any = {
      mainGroup: props.mainGroup?.uuid,
      productRefGroup: props.productRefGroup?.uuid,
      buildConfigurationList: props.buildConfigurationList?.uuid,
      knownRegions: props.knownRegions,
      attributes: props.attributes,
      compatibilityVersion: quoteForRead(props.compatibilityVersion),
      developmentRegion: quoteForRead(props.developmentRegion),
    };
    defineLiveRefArray(view, 'targets', props.targets, this.inner);
    return view;
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
    this.relinkStandIns();
    return build(this.inner.toJSON());
  }

  // Stand-ins (`{ uuid }`) pushed for link-before-register are replaced with the
  // now-registered model before serialization (`@bacons` can't serialize a bare
  // `{ uuid }` in a single-reference field).
  private relinkStandIns(): void {
    const isStandIn = (v: any) =>
      v && typeof v === 'object' && !Array.isArray(v) && typeof v.uuid === 'string' && !v.props;
    for (const model of this.models()) {
      const props = model.props;
      for (const key of Object.keys(props)) {
        const value = props[key];
        if (isStandIn(value)) {
          const real = this.safeGetObject(value.uuid);
          if (real) props[key] = real;
        } else if (Array.isArray(value)) {
          value.forEach((entry, i) => {
            if (isStandIn(entry)) {
              const real = this.safeGetObject(entry.uuid);
              if (real) value[i] = real;
            }
          });
        }
      }
    }
  }

  get hash(): any {
    const self = this;
    return {
      project: {
        objects: new Proxy(
          {},
          {
            // Absent sections read as undefined (legacy has no dict for an isa
            // with no objects); assigning one records its existence and creates
            // any objects it carries.
            get: (_t, isa: string) =>
              self.sectionExists(String(isa)) ? self.hashSection(String(isa)) : undefined,
            set: (_t, isa: string, value: any) => {
              self.hashCreatedSections.add(String(isa));
              if (value && typeof value === 'object') {
                for (const [key, obj] of Object.entries(value)) {
                  if (!key.endsWith('_comment')) self.createFromLegacyObject(key, obj);
                }
              }
              return true;
            },
          }
        ),
      },
    };
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

  pbxProjectSection(): any {
    return this.legacySection('PBXProject');
  }
  pbxNativeTargetSection(): any {
    return this.legacySection('PBXNativeTarget');
  }
  pbxXCBuildConfigurationSection(): any {
    return this.legacySection('XCBuildConfiguration');
  }
  pbxXCConfigurationList(): any {
    return this.legacySection('XCConfigurationList');
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
    let phase = (targetModel?.props?.buildPhases ?? []).find(
      (p: any) => p.isa === isa && (p.props.name == null || trimQuotes(p.props.name) === name)
    );
    // Legacy fallback: when the passed target doesn't own the named phase, match
    // it by name across the whole section (e.g. a phase that lives on the app
    // target is looked up via a freshly-created extension target).
    if (!phase) {
      phase = this.modelsOfIsa(isa).find((p) => trimQuotes(p.props.name ?? '') === name);
    }
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
  pbxTargetByName(name: string): any {
    const model = this.modelsOfIsa('PBXNativeTarget').find(
      (t) => trimQuotes(t.props.name) === name
    );
    return model ? this.legacyTarget(model) : null;
  }
  pbxItemByComment(..._args: any[]): any {
    notImplemented('pbxItemByComment');
  }
  findTargetKey(name: string): any {
    const model = this.modelsOfIsa('PBXNativeTarget').find(
      (t) => trimQuotes(t.props.name) === name
    );
    return model ? model.uuid : null;
  }
  findPBXGroupKey(..._args: any[]): any {
    notImplemented('findPBXGroupKey');
  }
  findPBXGroupKeyAndType(..._args: any[]): any {
    notImplemented('findPBXGroupKeyAndType');
  }
  getPBXObject(name: string): any {
    return this.hashSection(name);
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
    return quoteForRead(result);
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
    // Tolerate link-before-register: some plugins add the build file before its
    // file reference. A stand-in carrying the uuid serializes the right ref once
    // the file reference is registered (moments later).
    this.createObjectWithUuid(file.uuid, {
      isa: 'PBXBuildFile',
      fileRef: this.safeGetObject(file.fileRef) ?? { uuid: file.fileRef },
      settings: file.settings,
    });
  }
  removeFromPbxBuildFileSection(..._args: any[]): any {
    notImplemented('removeFromPbxBuildFileSection');
  }
  addToPbxProjectSection(target: any): void {
    this.inner.rootObject.props.targets.push(this.inner.getObject(target.uuid));
  }
  addToPbxNativeTargetSection(target: any): void {
    const nt = target.pbxNativeTarget;
    this.createObjectWithUuid(target.uuid, {
      isa: 'PBXNativeTarget',
      name: trimQuotes(nt.name),
      productName: trimQuotes(nt.productName),
      productReference: this.inner.getObject(nt.productReference),
      productType: trimQuotes(nt.productType),
      buildConfigurationList: this.inner.getObject(nt.buildConfigurationList),
      buildPhases: [],
      buildRules: [],
      dependencies: [],
    });
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
  removeFromPbxFrameworksBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxFrameworksBuildPhase');
  }
  removeFromPbxEmbedFrameworksBuildPhase(..._args: any[]): any {
    notImplemented('removeFromPbxEmbedFrameworksBuildPhase');
  }
  addToPbxCopyfilesBuildPhase(file: any): void {
    // Legacy falls back to a project-wide search by name when the file's target
    // doesn't own the "Copy Files" phase (it lives on the host app target).
    const phase = this.modelsOfIsa('PBXCopyFilesBuildPhase').find(
      (p) => trimQuotes(p.props.name ?? '') === 'Copy Files'
    );
    if (phase) phase.props.files.push(this.inner.getObject(file.uuid));
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

  addFramework(fpath: string, opt: any = {}): any {
    const customFramework = opt.customFramework === true;
    const link = opt.link === undefined || opt.link;
    const embed = !!opt.embed;

    const file = new PbxFile(fpath, { ...opt, embed: false });
    file.uuid = this.generateUuid();
    file.fileRef = this.generateUuid();
    file.target = opt.target;

    if (file.path && this.hasFile(file.path)) return false;

    // Create the file reference before the build file that points at it (legacy's
    // untyped hash tolerated the reverse order; the typed model needs the ref first).
    this.addToPbxFileReferenceSection(file);
    this.addToPbxBuildFileSection(file);
    this.addToFrameworksPbxGroup(file);
    if (link) this.addToPbxFrameworksBuildPhase(file);

    if (customFramework) {
      this.addToFrameworkSearchPaths(file);
      if (embed) {
        const embeddedFile = new PbxFile(fpath, { ...opt, embed: true });
        embeddedFile.uuid = this.generateUuid();
        embeddedFile.fileRef = file.fileRef;
        embeddedFile.target = opt.target;
        this.addToPbxBuildFileSection(embeddedFile);
        this.addToPbxEmbedFrameworksBuildPhase(embeddedFile);
        return embeddedFile;
      }
    }
    return file;
  }
  removeFramework(..._args: any[]): any {
    notImplemented('removeFramework');
  }
  addToFrameworksPbxGroup(file: any): void {
    const group = this.pbxGroupByName('Frameworks');
    if (!group) {
      this.addPbxGroup([file.path], 'Frameworks');
    } else {
      group.children.push({ value: file.fileRef, comment: file.basename });
    }
  }
  addToPbxFrameworksBuildPhase(file: any): void {
    this.addBuildFileToPhase('PBXFrameworksBuildPhase', file);
  }
  // Custom frameworks add their containing dir (as a quoted path) to the
  // app target's FRAMEWORK_SEARCH_PATHS.
  addToFrameworkSearchPaths(file: any): void {
    const value = `"${file.dirname}"`;
    const productName = this.productName;
    for (const config of this.modelsOfIsa('XCBuildConfiguration')) {
      const buildSettings = config.props.buildSettings;
      if (trimQuotes(buildSettings.PRODUCT_NAME ?? '') !== productName) continue;
      if (
        !buildSettings.FRAMEWORK_SEARCH_PATHS ||
        buildSettings.FRAMEWORK_SEARCH_PATHS === INHERITED
      ) {
        buildSettings.FRAMEWORK_SEARCH_PATHS = [INHERITED];
      }
      buildSettings.FRAMEWORK_SEARCH_PATHS.push(value);
    }
  }
  // Mirrors the legacy quirk: only links into an existing "Embed Frameworks"
  // copy-files phase; if none exists it silently no-ops.
  addToPbxEmbedFrameworksBuildPhase(file: any): void {
    const phase = (this.targetModel(file.target)?.props?.buildPhases ?? []).find(
      (p: any) =>
        p.isa === 'PBXCopyFilesBuildPhase' && trimQuotes(p.props.name ?? '') === 'Embed Frameworks'
    );
    if (phase) phase.props.files.push(this.inner.getObject(file.uuid));
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

  addTarget(name: string, type: string, subfolder?: string, bundleId?: string): any {
    const targetUuid = this.generateUuid();
    const targetSubfolder = subfolder || name;
    const targetName = name.trim();
    if (!targetName) throw new Error('Target name missing.');
    if (!type) throw new Error('Target type missing.');
    const productType = PRODUCTTYPE_BY_TARGETTYPE[type];
    if (!productType) throw new Error('Target type invalid: ' + type);

    // Quote placement mirrors legacy `xcode` (the trailing quote lands inside join).
    const infoPlist = '"' + path.join(targetSubfolder, targetSubfolder + '-Info.plist"');
    const runpath = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
    const debug: Record<string, any> = {
      GCC_PREPROCESSOR_DEFINITIONS: ['"DEBUG=1"', '"$(inherited)"'],
      INFOPLIST_FILE: infoPlist,
      LD_RUNPATH_SEARCH_PATHS: runpath,
      PRODUCT_NAME: '"' + targetName + '"',
      SKIP_INSTALL: 'YES',
    };
    const release: Record<string, any> = {
      INFOPLIST_FILE: infoPlist,
      LD_RUNPATH_SEARCH_PATHS: runpath,
      PRODUCT_NAME: '"' + targetName + '"',
      SKIP_INSTALL: 'YES',
    };
    if (bundleId) {
      debug.PRODUCT_BUNDLE_IDENTIFIER = '"' + bundleId + '"';
      release.PRODUCT_BUNDLE_IDENTIFIER = '"' + bundleId + '"';
    }

    const buildConfigurations = this.addXCConfigurationList(
      [
        { name: 'Debug', isa: 'XCBuildConfiguration', buildSettings: debug },
        { name: 'Release', isa: 'XCBuildConfiguration', buildSettings: release },
      ],
      'Release',
      'Build configuration list for PBXNativeTarget "' + targetName + '"'
    );

    const productFile = this.addProductFile(targetName, {
      group: 'Copy Files',
      target: targetUuid,
      explicitFileType: FILETYPE_BY_PRODUCTTYPE[productType],
    });
    this.addToPbxBuildFileSection(productFile);

    const target = {
      uuid: targetUuid,
      pbxNativeTarget: {
        isa: 'PBXNativeTarget',
        name: '"' + targetName + '"',
        productName: '"' + targetName + '"',
        productReference: productFile.fileRef,
        productType: '"' + productType + '"',
        buildConfigurationList: buildConfigurations.uuid,
        buildPhases: [],
        buildRules: [],
        dependencies: [],
      },
    };
    this.addToPbxNativeTargetSection(target);

    if (type === 'app_extension') {
      this.addBuildPhase(
        [],
        'PBXCopyFilesBuildPhase',
        'Copy Files',
        this.getFirstTarget().uuid,
        type
      );
      this.addToPbxCopyfilesBuildPhase(productFile);
    }

    this.addToPbxProjectSection(target);
    this.addTargetDependency(this.getFirstTarget().uuid, [target.uuid]);

    return target;
  }
  addTargetDependency(targetUuid: string, dependencyTargets: string[]): any {
    if (!targetUuid) return undefined;
    const targetModel = this.safeGetObject(targetUuid);
    if (!targetModel) throw new Error('Invalid target: ' + targetUuid);
    for (const dep of dependencyTargets) {
      if (!this.safeGetObject(dep)) throw new Error('Invalid target: ' + dep);
    }
    // Legacy only wires dependencies when both sections already exist (plugins
    // pre-create them via `hash.project.objects[ISA] ??= {}`).
    const sectionsExist =
      this.sectionExists('PBXTargetDependency') && this.sectionExists('PBXContainerItemProxy');
    for (const depUuid of sectionsExist ? dependencyTargets : []) {
      const depModel = this.safeGetObject(depUuid);
      const itemProxy = this.createObjectWithUuid(this.generateUuid(), {
        isa: 'PBXContainerItemProxy',
        containerPortal: this.inner.rootObject,
        proxyType: 1,
        remoteGlobalIDString: depUuid,
        remoteInfo: trimQuotes(depModel.props.name),
      });
      const targetDependency = this.createObjectWithUuid(this.generateUuid(), {
        isa: 'PBXTargetDependency',
        target: depModel,
        targetProxy: itemProxy,
      });
      targetModel.props.dependencies.push(targetDependency);
    }
    return { uuid: targetUuid, target: this.legacyTarget(targetModel) };
  }
  addXCConfigurationList(
    configurationObjectsArray: any[],
    defaultConfigurationName: string,
    _comment?: string
  ): any {
    const buildConfigurations = configurationObjectsArray.map((configuration) =>
      this.createObjectWithUuid(this.generateUuid(), {
        isa: 'XCBuildConfiguration',
        name: configuration.name,
        buildSettings: unquoteBuildSettings(configuration.buildSettings),
      })
    );
    const list = this.createObjectWithUuid(this.generateUuid(), {
      isa: 'XCConfigurationList',
      buildConfigurations,
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName,
    });
    return { uuid: list.uuid, xcConfigurationList: this.legacyConfigList(list) };
  }
  addProductFile(targetPath: string, opt: any = {}): any {
    const file = new PbxFile(targetPath, opt);
    file.includeInIndex = 0;
    file.fileRef = this.generateUuid();
    file.target = opt.target;
    file.group = opt.group;
    file.uuid = this.generateUuid();
    file.path = file.basename;
    this.addToPbxFileReferenceSection(file);
    this.addToProductsPbxGroup(file);
    return file;
  }
  removeProductFile(..._args: any[]): any {
    notImplemented('removeProductFile');
  }
  addToProductsPbxGroup(file: any): void {
    const group = this.pbxGroupByName('Products');
    if (!group) {
      this.addPbxGroup([file.path], 'Products');
    } else {
      group.children.push({ value: file.fileRef, comment: file.basename });
    }
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
