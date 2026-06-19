// Operation scenarios derived from real first- and third-party config-plugin
// call patterns. Each performs one read/mutation sequence using only the legacy
// `xcode` surface, so it runs unchanged against the legacy library (golden
// baseline) and `XcodeProjectShim` (differential harness). A scenario never
// loads a fixture or serializes — the harness owns both so it can compare.

import type { ScenarioContext } from './adapters';
import type { FixtureName } from './fixtures';

const APPLICATION_PRODUCT_TYPE = 'com.apple.product-type.application';

export interface Scenario {
  /** Stable identifier; also the snapshot key. */
  name: string;
  description: string;
  fixture: FixtureName;
  /** Optionally returns a JSON-serializable summary of read results to compare. */
  run: (ctx: ScenarioContext) => unknown;
}

function appTarget(project: any): { uuid: string; target: any } {
  const target = project.getTarget(APPLICATION_PRODUCT_TYPE);
  if (!target) {
    throw new Error('Fixture is missing an application PBXNativeTarget');
  }
  return target;
}

/**
 * Mirrors `Xcodeproj.addFileToGroupAndLink`: create a `pbxFile`, dedupe against
 * the group, assign uuids, register it in the requested sections, and push it
 * into the group's children. Returns the file's resolved basename + whether it
 * was added (false on duplicate), with UUIDs left for the harness to compare.
 */
function addFileToGroup(
  { project, PbxFile }: ScenarioContext,
  {
    filepath,
    groupName,
    isBuildFile,
    phase,
  }: {
    filepath: string;
    groupName: string;
    isBuildFile: boolean;
    phase: 'resources' | 'sources';
  }
): { basename: string; added: boolean } {
  const { firstProject } = project.getFirstProject();
  let group = project.getPBXGroupByKey(firstProject.mainGroup);
  for (const component of groupName.split('/')) {
    const child = group?.children?.find((c: any) => c.comment === component);
    const next = child ? project.getPBXGroupByKey(child.value) : null;
    if (!next) break;
    group = next;
  }

  const file = new PbxFile(filepath);
  if (group.children.find((c: any) => c.comment === file.basename)) {
    return { basename: file.basename, added: false };
  }

  file.target = appTarget(project).uuid;
  file.uuid = project.generateUuid();
  file.fileRef = project.generateUuid();

  project.addToPbxFileReferenceSection(file);
  // Real callers always add resource/source files as build files; a non-build
  // file is just a file reference in a group, not linked into a build phase.
  if (isBuildFile) {
    project.addToPbxBuildFileSection(file);
    if (phase === 'resources') {
      project.addToPbxResourcesBuildPhase(file);
    } else {
      project.addToPbxSourcesBuildPhase(file);
    }
  }
  group.children.push({ value: file.fileRef, comment: file.basename });
  return { basename: file.basename, added: true };
}

/** Strip surrounding quotes the way the wrapper's `unquote` does. */
function unquote(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.match(/^"(.*)"$/)?.[1] ?? value;
}

// --- scenarios ------------------------------------------------------------

export const scenarios: Scenario[] = [
  // === Build settings ===
  {
    name: 'build-settings/set-bundle-identifier',
    description: 'addBuildProperty PRODUCT_BUNDLE_IDENTIFIER across all configs',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', '"com.example.differential"');
      return { value: unquote(project.getBuildProperty('PRODUCT_BUNDLE_IDENTIFIER')) };
    },
  },
  {
    name: 'build-settings/set-development-team',
    description: 'addBuildProperty DEVELOPMENT_TEAM',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addBuildProperty('DEVELOPMENT_TEAM', 'J5FM626PE2');
      return { value: project.getBuildProperty('DEVELOPMENT_TEAM') };
    },
  },
  {
    name: 'build-settings/set-deployment-target',
    description: 'addBuildProperty IPHONEOS_DEPLOYMENT_TARGET',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '15.1');
      return { value: project.getBuildProperty('IPHONEOS_DEPLOYMENT_TARGET') };
    },
  },
  {
    name: 'build-settings/toggle-bitcode',
    description: 'add then remove ENABLE_BITCODE',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addBuildProperty('ENABLE_BITCODE', 'YES');
      const afterAdd = project.getBuildProperty('ENABLE_BITCODE');
      project.removeBuildProperty('ENABLE_BITCODE');
      return { afterAdd, afterRemove: project.getBuildProperty('ENABLE_BITCODE') ?? null };
    },
  },
  {
    name: 'build-settings/set-device-family',
    description: 'addBuildProperty TARGETED_DEVICE_FAMILY',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addBuildProperty('TARGETED_DEVICE_FAMILY', '"1,2"');
      return { value: unquote(project.getBuildProperty('TARGETED_DEVICE_FAMILY')) };
    },
  },
  {
    name: 'build-settings/update-product-name',
    description: 'updateProductName updates PRODUCT_NAME on every config',
    fixture: 'bareMinimum',
    run({ project }) {
      project.updateProductName('RenamedApp');
      return { value: unquote(project.getBuildProperty('PRODUCT_NAME')) };
    },
  },
  {
    name: 'build-settings/set-entitlements',
    description: 'addBuildProperty CODE_SIGN_ENTITLEMENTS',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addBuildProperty(
        'CODE_SIGN_ENTITLEMENTS',
        '"HelloWorld/HelloWorld.entitlements"',
        'Release'
      );
      return {
        release: unquote(project.getBuildProperty('CODE_SIGN_ENTITLEMENTS', 'Release')),
        debug: project.getBuildProperty('CODE_SIGN_ENTITLEMENTS', 'Debug') ?? null,
      };
    },
  },
  {
    name: 'build-settings/update-property-for-target',
    description: 'updateBuildProperty scoped to a named target (multi-target)',
    fixture: 'multitarget',
    run({ project }) {
      project.updateBuildProperty(
        'PRODUCT_BUNDLE_IDENTIFIER',
        '"com.example.share"',
        null,
        'shareextension'
      );
      return {
        share: unquote(
          project.getBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', undefined, 'shareextension')
        ),
      };
    },
  },

  // === Files & groups ===
  {
    name: 'files/add-resource-file',
    description: 'addResourceFileToGroup: file ref + build file + resources phase',
    fixture: 'bareMinimum',
    run(ctx) {
      const r = addFileToGroup(ctx, {
        filepath: 'HelloWorld/new-resource.png',
        groupName: 'HelloWorld',
        isBuildFile: true,
        phase: 'resources',
      });
      return { ...r, hasFile: !!ctx.project.hasFile('HelloWorld/new-resource.png') };
    },
  },
  {
    name: 'files/add-resource-file-no-build',
    description: 'addResourceFileToGroup with isBuildFile=false (no PBXBuildFile)',
    fixture: 'bareMinimum',
    run(ctx) {
      const before = Object.keys(ctx.project.pbxBuildFileSection()).length;
      addFileToGroup(ctx, {
        filepath: 'HelloWorld/readme-only.txt',
        groupName: 'HelloWorld',
        isBuildFile: false,
        phase: 'resources',
      });
      const after = Object.keys(ctx.project.pbxBuildFileSection()).length;
      return { buildFileCountUnchanged: before === after };
    },
  },
  {
    name: 'files/add-source-file',
    description: 'addBuildSourceFileToGroup: file ref + build file + sources phase',
    fixture: 'bareMinimum',
    run(ctx) {
      return addFileToGroup(ctx, {
        filepath: 'HelloWorld/MyClass.swift',
        groupName: 'HelloWorld',
        isBuildFile: true,
        phase: 'sources',
      });
    },
  },
  {
    name: 'files/add-duplicate-resource',
    description: 'adding the same file twice is a no-op the second time',
    fixture: 'bareMinimum',
    run(ctx) {
      const first = addFileToGroup(ctx, {
        filepath: 'HelloWorld/dup-resource.png',
        groupName: 'HelloWorld',
        isBuildFile: true,
        phase: 'resources',
      });
      const refsAfterFirst = Object.keys(ctx.project.pbxFileReferenceSection()).length;
      const second = addFileToGroup(ctx, {
        filepath: 'HelloWorld/dup-resource.png',
        groupName: 'HelloWorld',
        isBuildFile: true,
        phase: 'resources',
      });
      const refsAfterSecond = Object.keys(ctx.project.pbxFileReferenceSection()).length;
      return {
        firstAdded: first.added,
        secondAdded: second.added,
        refsUnchanged: refsAfterFirst === refsAfterSecond,
      };
    },
  },
  {
    name: 'files/ensure-group-recursively',
    description: 'ensureGroupRecursively creates nested PBXGroups',
    fixture: 'bareMinimum',
    run({ project }) {
      const components = 'HelloWorld/Generated/Sources'.split('/');
      const { firstProject } = project.getFirstProject();
      let group = project.getPBXGroupByKey(firstProject.mainGroup);
      for (const name of components) {
        if (group && !group.children.find((c: any) => c.comment === name)) {
          group.children.push({ comment: name, value: project.pbxCreateGroup(name, '""') });
        }
        group = project.pbxGroupByName(name);
      }
      return {
        created: group?.name,
        hasGenerated: !!project.pbxGroupByName('Generated'),
        hasSources: !!project.pbxGroupByName('Sources'),
      };
    },
  },
  {
    name: 'files/add-pbx-group',
    description: 'addPbxGroup creates a group with file references',
    fixture: 'bareMinimum',
    run({ project }) {
      const { uuid, pbxGroup } = project.addPbxGroup(
        ['Widget/Widget.swift', 'Widget/Info.plist'],
        'Widget',
        'Widget'
      );
      return {
        name: pbxGroup.name,
        path: pbxGroup.path,
        sourceTree: pbxGroup.sourceTree,
        childCount: pbxGroup.children.length,
        registered: !!project.getPBXGroupByKey(uuid),
      };
    },
  },
  {
    name: 'files/add-to-pbx-group',
    description: 'pbxCreateGroupWithType + addToPbxGroup links a file into a group',
    fixture: 'bareMinimum',
    run({ project, PbxFile }) {
      const key = project.pbxCreateGroupWithType('Extras', 'Extras', 'PBXGroup');
      const file = new PbxFile('Extras/Thing.swift');
      file.uuid = project.generateUuid();
      file.fileRef = project.generateUuid();
      project.addToPbxFileReferenceSection(file);
      project.addToPbxGroup(file, key);
      const group = project.getPBXGroupByKey(key);
      return { groupName: group.name, childComments: group.children.map((c: any) => c.comment) };
    },
  },
  {
    name: 'files/has-file',
    description: 'hasFile read against an existing file reference',
    fixture: 'bareMinimum',
    run({ project }) {
      return {
        present: !!project.hasFile('HelloWorld/Images.xcassets'),
        absent: project.hasFile('does/not/exist.swift'),
      };
    },
  },

  // === Frameworks ===
  {
    name: 'frameworks/add-framework',
    description: 'addFramework links a system framework to the app target',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = appTarget(project);
      const file = project.addFramework('StoreKit.framework', { target: target.uuid });
      return { basename: file.basename, path: file.path, group: file.group };
    },
  },
  {
    name: 'frameworks/add-framework-weak',
    description: 'addFramework with { weak: true } sets the Weak attribute',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = appTarget(project);
      const file = project.addFramework('CoreNFC.framework', { weak: true, target: target.uuid });
      return { basename: file.basename, settings: file.settings };
    },
  },
  {
    name: 'frameworks/add-custom-framework-embed-sign',
    description: 'addFramework custom + embed + sign (react-native-adjust pattern)',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = appTarget(project);
      const file = project.addFramework('vendor/Adjust.framework', {
        customFramework: true,
        embed: true,
        sign: true,
        target: target.uuid,
      });
      return { basename: file.basename, settings: file.settings };
    },
  },
  {
    name: 'frameworks/embed-frameworks-phase',
    description: 'pbxEmbedFrameworksBuildPhaseObj resolves the Embed Frameworks copy phase',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = appTarget(project);
      const before = project.pbxEmbedFrameworksBuildPhaseObj(target.uuid);
      project.addFramework('vendor/Embed.framework', {
        customFramework: true,
        embed: true,
        target: target.uuid,
      });
      const after = project.pbxEmbedFrameworksBuildPhaseObj(target.uuid);
      return {
        existedBefore: !!before,
        existsAfter: !!after,
        fileCount: after ? after.files.length : 0,
      };
    },
  },

  // === Build phases ===
  {
    name: 'build-phases/add-shell-script',
    description: 'addBuildPhase PBXShellScriptBuildPhase',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = appTarget(project);
      const { buildPhase } = project.addBuildPhase(
        [],
        'PBXShellScriptBuildPhase',
        'Upload Source Maps',
        target.uuid,
        {
          shellPath: '/bin/sh',
          shellScript: 'echo "uploading"',
          // Paths are passed pre-quoted, the way Xcode represents them.
          inputPaths: ['"$(SRCROOT)/main.jsbundle"'],
          outputPaths: [],
        }
      );
      return {
        isa: buildPhase.isa,
        name: buildPhase.name,
        shellPath: buildPhase.shellPath,
        shellScript: buildPhase.shellScript,
        inputPaths: buildPhase.inputPaths,
      };
    },
  },
  {
    name: 'build-phases/add-copy-files',
    description: 'addBuildPhase PBXCopyFilesBuildPhase with a folder spec',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = appTarget(project);
      const { buildPhase } = project.addBuildPhase(
        [],
        'PBXCopyFilesBuildPhase',
        'Copy Files',
        target.uuid,
        'frameworks'
      );
      return {
        isa: buildPhase.isa,
        name: buildPhase.name,
        dstSubfolderSpec: buildPhase.dstSubfolderSpec,
        dstPath: buildPhase.dstPath,
      };
    },
  },
  {
    name: 'build-phases/build-phase-object',
    description: 'buildPhaseObject resolves an existing phase by name + target',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = appTarget(project);
      const sources = project.buildPhaseObject('PBXSourcesBuildPhase', 'Sources', target.uuid);
      return { isa: sources?.isa, fileCount: sources?.files?.length ?? 0 };
    },
  },

  // === Targets / extensions ===
  {
    name: 'targets/add-app-extension',
    description: 'addTarget app_extension (sticker / share-extension pattern)',
    fixture: 'bareMinimum',
    run({ project }) {
      const target = project.addTarget(
        'Stickers',
        'app_extension',
        'Stickers',
        'com.example.app.Stickers'
      );
      return {
        name: target.pbxNativeTarget.name,
        productType: target.pbxNativeTarget.productType,
        productName: target.pbxNativeTarget.productName,
        hasConfigList: !!target.pbxNativeTarget.buildConfigurationList,
      };
    },
  },
  {
    name: 'targets/add-target-dependency',
    description: 'addTargetDependency wires a new target as a dependency of the app',
    fixture: 'bareMinimum',
    run({ project }) {
      const app = project.getFirstTarget();
      const ext = project.addTarget('Widget', 'app_extension', 'Widget', 'com.example.app.Widget');
      const result = project.addTargetDependency(app.uuid, [ext.uuid]);
      return {
        dependencyCount: result.target.dependencies.length,
        hasContainerItemProxy: !!project.hash.project.objects['PBXContainerItemProxy'],
      };
    },
  },
  {
    name: 'targets/hash-precreated-target-dependency',
    description:
      'pre-create dependency sections via hash, then addTargetDependency (widgets pattern)',
    fixture: 'bareMinimum',
    run({ project }) {
      const app = project.getFirstTarget();
      const ext = project.addTarget('Widget', 'app_extension', 'Widget', 'com.example.app.Widget');
      const objects = project.hash.project.objects;
      objects.PBXTargetDependency ??= {};
      objects.PBXContainerItemProxy ??= {};
      project.addTargetDependency(app.uuid, [ext.uuid]);
      return {
        appDependencyCount: project.getFirstTarget().firstTarget.dependencies.length,
        hasContainerItemProxy: !!project.hash.project.objects['PBXContainerItemProxy'],
      };
    },
  },
  {
    name: 'targets/add-xc-configuration-list',
    description: 'addXCConfigurationList registers build configs + a config list',
    fixture: 'bareMinimum',
    run({ project }) {
      const { uuid, xcConfigurationList } = project.addXCConfigurationList(
        [
          { name: 'Debug', isa: 'XCBuildConfiguration', buildSettings: { PRODUCT_NAME: '"Ext"' } },
          {
            name: 'Release',
            isa: 'XCBuildConfiguration',
            buildSettings: { PRODUCT_NAME: '"Ext"' },
          },
        ],
        'Release',
        'Build configuration list for PBXNativeTarget "Ext"'
      );
      return {
        registered: !!project.pbxXCConfigurationList()[uuid],
        defaultConfigurationName: xcConfigurationList.defaultConfigurationName,
        buildConfigurationCount: xcConfigurationList.buildConfigurations.length,
      };
    },
  },
  {
    name: 'targets/add-product-file',
    description: 'addProductFile registers a product reference in Products',
    fixture: 'bareMinimum',
    run({ project }) {
      const file = project.addProductFile('Widget', {
        group: 'Copy Files',
        target: project.getFirstTarget().uuid,
        explicitFileType: '"wrapper.app-extension"',
      });
      return {
        basename: file.basename,
        includeInIndex: file.includeInIndex,
        explicitFileType: file.explicitFileType,
      };
    },
  },
  {
    name: 'targets/pbx-target-by-name',
    description: 'pbxTargetByName + findTargetKey resolve an existing target',
    fixture: 'multitarget',
    run({ project }) {
      const target = project.pbxTargetByName('shareextension');
      return {
        found: !!target,
        productType: target?.productType,
        key: project.findTargetKey('shareextension'),
      };
    },
  },

  // === Header search paths / linker flags ===
  {
    name: 'build-settings/add-header-search-paths',
    description: 'addToHeaderSearchPaths appends to the app target configs',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addToHeaderSearchPaths('"$(SRCROOT)/../node_modules/foo/include"');
      return { value: project.getBuildProperty('HEADER_SEARCH_PATHS') };
    },
  },
  {
    name: 'build-settings/add-other-linker-flags',
    description: 'addToOtherLinkerFlags appends -ObjC (callkeep pattern)',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addToOtherLinkerFlags('-ObjC');
      return { value: project.getBuildProperty('OTHER_LDFLAGS') };
    },
  },

  // === Misc / direct manipulation ===
  {
    name: 'misc/add-known-region',
    description: 'addKnownRegion adds a locale to the project',
    fixture: 'bareMinimum',
    run({ project }) {
      project.addKnownRegion('fr');
      return {
        hasFr: project.hasKnownRegion('fr'),
        regions: project.getFirstProject().firstProject.knownRegions,
      };
    },
  },
  {
    name: 'misc/direct-hash-objects',
    description: 'direct hash.project.objects access + mutation (sticker plugin pattern)',
    fixture: 'bareMinimum',
    run({ project }) {
      const targets = project.getPBXObject('PBXNativeTarget');
      const configs = project.hash.project.objects['XCBuildConfiguration'];
      // Write a setting directly into every non-comment build configuration.
      for (const key of Object.keys(configs)) {
        if (key.endsWith('_comment')) continue;
        configs[key].buildSettings.SWIFT_VERSION = '5.0';
      }
      return {
        nativeTargetCount: Object.keys(targets).filter((k) => !k.endsWith('_comment')).length,
        swiftVersion: unquote(project.getBuildProperty('SWIFT_VERSION')),
      };
    },
  },
];
