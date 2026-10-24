import { minimatch } from 'minimatch';
import { readdir, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { exists, readJSON, readText, writeGenerated } from './files';
import { frameworkTargets } from './framework-targets';
import { runtimeBuildSettings, runtimeNames, runtimePaths } from './ios-settings';
import type { discoverNativeModules } from './native';
import { Project, selectHost, attachSubproject, shellQuote, splitFlags } from './xcode';
type NativePlan = Awaited<ReturnType<typeof discoverNativeModules>>;
export type SourceProjectOptions = {
  root: string;
  project: string;
  target: string;
  templates: string;
  node: string;
};
const array = (value: string | string[] | undefined): string[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];
async function glob(root: string, patterns: string[]): Promise<string[]> {
  if (!(await exists(root))) return [];
  const paths: string[] = [];
  for (const path of await readdir(root, { recursive: true })) {
    if (
      patterns.some((pattern) => minimatch(path, pattern)) &&
      (await stat(join(root, path))).isFile()
    )
      paths.push(join(root, path));
  }
  return paths.sort();
}
export async function validateSourceProject(options: SourceProjectOptions) {
  const host = await Project.open(join(options.project, 'project.pbxproj'));
  const configPath = join(options.root, 'expo-embedding.json');
  const settings = (await exists(configPath)) ? await readJSON(configPath) : {};
  return { host, ...selectHost(host, options.target, settings.configurations ?? {}) };
}
export async function configureSourceProject(
  options: SourceProjectOptions,
  plan: NativePlan
): Promise<void> {
  const { root, templates, node } = options;
  const gen = join(root, '.expo-source');
  const { host: appProject, target: app, configurations } = await validateSourceProject(options);
  const names = appProject.configurations(app).map((config) => config.name);
  const project = Project.create(names);
  const group = project.add('PBXGroup', 'sources', {
    children: [],
    name: 'Expo Sources',
    sourceTree: '<group>',
  });
  project.object(project.root.mainGroup).children.unshift(group);
  const packageRoot = (name: string, from = join(root, 'expo')) =>
    plan.modules.find((module) => module.packageName === name)?.packageRoot ??
    dirname(createRequire(join(from, 'package.json')).resolve(`${name}/package.json`));
  const rn = plan.reactNativeRoot;
  const expoRoot = plan.expoRoot;
  const coreRoot = packageRoot('expo-modules-core');
  const common = runtimeBuildSettings(root);
  const { makeTarget, settings, depend, targetIds } = frameworkTargets({
    project,
    group,
    gen,
    names,
    configurations,
    common,
  });
  const jsiRoot = join(packageRoot('expo-modules-jsi', coreRoot), 'apple');
  const cxxHeaders = await glob(jsiRoot, ['Sources/ExpoModulesJSI-Cxx/include/**/*.h']);
  await rm(join(gen, 'headers/module.modulemap'), { force: true });
  for (const flavor of ['Debug', 'Release'])
    for (const slice of ['ios-arm64', 'ios-arm64_x86_64-simulator']) {
      await writeGenerated(
        join(gen, 'modulemaps', flavor, slice, 'module.modulemap'),
        'module ExpoModulesJSI_Cxx {\n' +
          cxxHeaders.map((file) => `header "${file}"\n`).join('') +
          `export *\n}\nmodule jsi {\nheader "${gen}/runtime/${flavor}/ReactNativeHeaders.xcframework/${slice}/Headers/jsi/jsi.h"\nheader "${gen}/runtime/${flavor}/ReactNativeHeaders.xcframework/${slice}/Headers/jsi/instrumentation.h"\nexport *\n}\n`
      );
    }
  const jsi = await makeTarget(
    'ExpoModulesJSI',
    await glob(jsiRoot, [
      'Sources/**/*.{swift,cpp}',
      'Sources/ExpoModulesJSI-Cxx/include/Public/*.h',
    ])
  );
  for (const config of settings(jsi)) {
    config.BUILD_LIBRARY_FOR_DISTRIBUTION = 'YES';
    config.HEADER_SEARCH_PATHS.push(
      `${jsiRoot}/Sources/ExpoModulesJSI-Cxx/include`,
      `${jsiRoot}/Sources/ExpoModulesJSI-Cxx/include/Public`
    );
    config.SWIFT_OBJC_INTEROP_MODE = 'objcxx';
    config.OTHER_SWIFT_FLAGS.push(
      '-cxx-interoperability-mode=default',
      '-enable-upcoming-feature',
      'NonisolatedNonsendingByDefault',
      '-enable-upcoming-feature',
      'InferIsolatedConformances',
      '-Xcc',
      '-iapinotes-modules',
      '-Xcc',
      `${jsiRoot}/APINotes`,
      '-Xfrontend',
      '-clang-header-expose-decls=has-expose-attr'
    );
  }
  await writeGenerated(
    join(gen, 'headers/ExpoModulesJSI-umbrella.h'),
    '#import <Foundation/Foundation.h>\n#ifdef __cplusplus\n#import <ExpoModulesJSI/NativeState.h>\n#endif\n'
  );
  const coreFiles = (await glob(coreRoot, ['{ios,common/cpp}/**/*.{h,m,mm,swift,cpp}'])).filter(
    (file) => !/\/ios\/(Tests|Benchmarks|Worklets|WorkletsTests|WorkletsAdapter)\//.test(file)
  );
  const core = await makeTarget(
    'ExpoModulesCore',
    coreFiles,
    coreFiles.filter((file) => file.endsWith('+Private.h') || file.endsWith('/Swift.h'))
  );
  const macro = join(packageRoot('expo-modules-macros', coreRoot), 'apple/ExpoModulesMacros');
  const macroFlags = ['-load-plugin-executable', `${macro}#ExpoModulesMacros`];
  for (const config of settings(core)) {
    config.OTHER_SWIFT_FLAGS.push(...macroFlags);
    config.GCC_PREPROCESSOR_DEFINITIONS.push(
      `EXPO_MODULES_CORE_VERSION=${(await readJSON(join(coreRoot, 'package.json'))).version}`
    );
  }
  depend(core, [jsi]);
  const codegenRoot = join(gen, 'build/generated/ios');
  const codegen = await makeTarget(
    'ReactCodegen',
    await glob(codegenRoot, ['ReactCodegen/**/*.{h,mm,cpp}'])
  );
  const provider = await makeTarget(
    'ReactAppDependencyProvider',
    await glob(codegenRoot, ['ReactAppDependencyProvider/*.{h,mm}'])
  );
  depend(provider, [codegen]);
  const codegenPhase = project.addPhase(
    codegen,
    'PBXShellScriptBuildPhase',
    'Generate React App Code',
    {
      alwaysOutOfDate: 1,
      shellPath: '/bin/sh',
      shellScript: `set -eu\n${shellQuote(node)} "$EXPO_APP_ROOT/.expo-source/scripts/codegen.cjs" "$EXPO_APP_ROOT"\n`,
    }
  );
  project.object(codegen).buildPhases = [
    codegenPhase,
    ...project.object(codegen).buildPhases.filter((id: string) => id !== codegenPhase),
  ];
  const expoFiles = (await glob(join(expoRoot, 'ios'), ['**/*.{h,m,mm,swift}'])).filter(
    (file) => !file.includes('/Tests/')
  );
  const expo = await makeTarget(
    'Expo',
    expoFiles,
    expoFiles.filter((file) => file.endsWith('/Swift.h'))
  );
  depend(expo, [core, jsi, provider, codegen]);
  const nativeModules = await addBundledModules();
  nativeModules.push(...(await addMetadataModules()));

  async function addBundledModules(): Promise<string[]> {
    const nativeModules: string[] = [];
    for (const module of plan.modules.filter(
      (module) =>
        !module.build &&
        !['expo', 'expo-modules-core', 'expo-modules-jsi', 'expo-sqlite'].includes(
          module.packageName
        )
    )) {
      const target = await makeTarget(
        module.targetName,
        (await glob(join(module.packageRoot, 'ios'), ['**/*.{h,m,mm,swift}'])).filter(
          (file) => !file.includes('/Tests/')
        )
      );
      for (const config of settings(target)) {
        config.SWIFT_VERSION = '5.0';
        config.OTHER_SWIFT_FLAGS.push(...macroFlags);
      }
      depend(target, [core, jsi]);
      const privacy = join(module.packageRoot, 'ios/PrivacyInfo.xcprivacy');
      if (await exists(privacy))
        project.addBuildFile(
          project.phase(target, 'PBXResourcesBuildPhase'),
          project.addFile(group, privacy)
        );
      nativeModules.push(target);
    }
    if (plan.modules.some((module) => module.packageName === 'expo-sqlite')) {
      const sqliteRoot = packageRoot('expo-sqlite');
      const sqlite = await makeTarget(
        'ExpoSQLite',
        await glob(sqliteRoot, ['ios/*.swift', 'vendor/sqlite3/*.{c,h}'])
      );
      const flags = [
        'HAVE_USLEEP=1',
        'SQLITE_ENABLE_LOCKING_STYLE=0',
        'SQLITE_ENABLE_BYTECODE_VTAB=1',
        'SQLITE_TEMP_STORE=2',
        'SQLITE_ENABLE_SESSION=1',
        'SQLITE_ENABLE_PREUPDATE_HOOK=1',
        'SQLITE_ENABLE_MATH_FUNCTIONS=1',
        'SQLITE_ENABLE_API_ARMOR=1',
        'SQLITE_ENABLE_FTS4=1',
        'SQLITE_ENABLE_FTS3_PARENTHESIS=1',
        'SQLITE_ENABLE_FTS5=1',
      ];
      for (const config of settings(sqlite)) {
        config.OTHER_CFLAGS = ['$(inherited)', ...flags.map((flag) => `-D${flag}`)];
        config.OTHER_SWIFT_FLAGS.push(
          ...flags.flatMap((flag) => ['-Xcc', `-D${flag}`]),
          ...macroFlags
        );
      }
      depend(sqlite, [core, jsi]);
      nativeModules.push(sqlite);
    }
    return nativeModules;
  }

  async function addMetadataModules(): Promise<string[]> {
    const nativeModules: string[] = [];
    const metadataTargets = plan.modules.flatMap((module) => module.build?.targets ?? []);
    const resourceRoot = join(gen, 'resources');
    const resourceNames = metadataTargets
      .filter((spec) => spec.resourceAccessor)
      .map((spec) => spec.name);
    if (await exists(resourceRoot))
      for (const name of await readdir(resourceRoot))
        if (!resourceNames.includes(name))
          await rm(join(resourceRoot, name), { recursive: true, force: true });
    for (const spec of metadataTargets) {
      const files = [...spec.files];
      if (spec.resourceAccessor && files.some((file) => file.endsWith('.swift'))) {
        const accessor = join(resourceRoot, spec.name, 'Bundle+Module.swift');
        await writeGenerated(
          accessor,
          'import Foundation\nprivate final class ExpoEmbeddingResourceBundleMarker {}\nextension Foundation.Bundle {\n  static let module = Bundle(for: ExpoEmbeddingResourceBundleMarker.self)\n}\n'
        );
        files.push(accessor);
      }
      const target = await makeTarget(
        spec.name,
        files,
        files.filter((file) => file.endsWith('.h') && !spec.publicHeaders.includes(file))
      );
      for (const config of project.configurations(target)) {
        const values = config.buildSettings;
        const flags = spec.settings[configurations[config.name] as 'Debug' | 'Release'];
        values.SWIFT_VERSION = spec.swiftVersion;
        values.IPHONEOS_DEPLOYMENT_TARGET = spec.deploymentTarget;
        values.HEADER_SEARCH_PATHS.push(...spec.headerSearchPaths);
        for (const [key, field] of Object.entries({
          OTHER_CFLAGS: 'cFlags',
          OTHER_CPLUSPLUSFLAGS: 'cxxFlags',
          OTHER_SWIFT_FLAGS: 'swiftFlags',
          OTHER_LDFLAGS: 'linkerFlags',
        }) as [string, keyof typeof flags][]) {
          (values[key] ??= ['$(inherited)']).push(...flags[field].map(shellQuote));
        }
        values.OTHER_SWIFT_FLAGS.push(...macroFlags);
        values.OTHER_LDFLAGS.push(...spec.frameworks.flatMap((name) => ['-framework', name]));
      }
      if (spec.resources.length) {
        const phase = project.addPhase(target, 'PBXCopyFilesBuildPhase', 'Copy native resources', {
          dstPath: '',
          dstSubfolderSpec: 7,
        });
        for (const path of spec.resources)
          project.addBuildFile(
            phase,
            project.addFile(group, path, (await stat(path)).isDirectory() ? 'folder' : undefined)
          );
      }
      nativeModules.push(target);
    }
    for (const spec of metadataTargets)
      depend(targetIds.get(spec.name)!, [
        core,
        jsi,
        ...spec.dependencies
          .filter((name) => !runtimeNames.includes(name))
          .map((name) => {
            const id = targetIds.get(name);
            if (!id)
              throw new Error(
                `Missing native target ${name}. Fix native dependencies and rerun init.`
              );
            return id;
          }),
      ]);
    return nativeModules;
  }

  const hostRoot = join(gen, 'Host');
  for (const name of [
    'ExpoHost.swift',
    'ExpoScene.swift',
    'ReactNativeDelegate.swift',
    'ExpoAppDelegate.swift',
  ])
    await writeGenerated(join(hostRoot, name), await readText(join(templates, name)));
  const host = await makeTarget('expoappbrownfield', [
    ...(await glob(hostRoot, ['*.swift'])),
    ...(await glob(join(root, 'expo/Native'), ['**/*.swift'])),
  ]);
  for (const config of settings(host)) config.OTHER_SWIFT_FLAGS.push(...macroFlags);
  depend(host, [expo, core, jsi, provider, codegen, ...nativeModules]);
  project.addPhase(host, 'PBXShellScriptBuildPhase', 'Bundle Expo JavaScript', {
    alwaysOutOfDate: 1,
    shellPath: '/bin/sh',
    shellScript: `set -eu
export NODE_BINARY=${shellQuote(node)}
export PROJECT_ROOT="$EXPO_APP_ROOT/expo"
if [ -z "\${ENTRY_FILE:-}" ]; then
  export ENTRY_FILE="$("$NODE_BINARY" ${shellQuote(join(expoRoot, 'scripts/resolveAppEntry.js'))} "$PROJECT_ROOT" ios absolute)"
fi
export CLI_PATH=${shellQuote(join(expoRoot, 'bin/cli'))}
export BUNDLE_COMMAND=export:embed
export SOURCEMAP_FILE="\${SOURCEMAP_FILE:-$EXPO_APP_ROOT/.expo-source/sourcemaps/$CONFIGURATION-$PLATFORM_NAME/main.jsbundle.map}"
mkdir -p "$(dirname "$SOURCEMAP_FILE")"
export CONFIGURATION="$EXPO_RUNTIME_CONFIGURATION"
export FORCE_BUNDLING=1
unset SKIP_BUNDLING
export REACT_NATIVE_PATH=${shellQuote(rn)}
/bin/bash "$REACT_NATIVE_PATH/scripts/react-native-xcode.sh"
`,
  });
  project.addFile(project.root.mainGroup, join(root, 'expo'), 'folder');
  await project.save(join(gen, 'ExpoEmbedding.xcodeproj/project.pbxproj'));
  attachSubproject(appProject, app, project, host);
  const linkedNames = [...runtimeNames, 'expoappbrownfield'];
  for (const config of appProject.configurations(app)) {
    const values = config.buildSettings;
    values.EXPO_APP_ROOT = '$(SRCROOT)';
    values['EXPO_RUNTIME_CONFIGURATION[sdk=iphone*]'] = configurations[config.name];
    for (const key of ['FRAMEWORK_SEARCH_PATHS', 'HEADER_SEARCH_PATHS']) {
      const conditional = `${key}[sdk=iphone*]`;
      const retained = array(values[conditional]).filter(
        (path) => !path.includes('$(EXPO_APP_ROOT)/.expo-source/')
      );
      values[conditional] = [...new Set([...retained, ...common[key]])];
    }
    const flags = array(values['OTHER_LDFLAGS[sdk=iphone*]']).flatMap(splitFlags);
    const retainedFlags: string[] = [];
    while (flags.length) {
      const flag = flags.shift()!;
      if (flag === '-framework' && linkedNames.includes(flags[0])) flags.shift();
      else if (!['$(inherited)', '-lc++', '-ObjC', ...linkedNames].includes(flag))
        retainedFlags.push(flag);
    }
    values['OTHER_LDFLAGS[sdk=iphone*]'] = [
      ...retainedFlags,
      ...common.OTHER_LDFLAGS,
      '-framework',
      'expoappbrownfield',
    ];
    for (const key of ['ENABLE_USER_SCRIPT_SANDBOXING', 'CLANG_CXX_LANGUAGE_STANDARD'])
      values[`${key}[sdk=iphone*]`] = common[key];
    values['EXPO_RUNTIME_SLICE[sdk=iphoneos*]'] = 'ios-arm64';
    values['EXPO_RUNTIME_SLICE[sdk=iphonesimulator*]'] = 'ios-arm64_x86_64-simulator';
  }
  const embed =
    appProject
      .object(app)
      .buildPhases.find((id: string) => appProject.object(id).name === 'Embed Expo Frameworks') ??
    appProject.addPhase(app, 'PBXShellScriptBuildPhase', 'Embed Expo Frameworks');
  Object.assign(appProject.object(embed), {
    alwaysOutOfDate: 1,
    shellPath: '/bin/sh',
    shellScript:
      'set -eu\ncase "$PLATFORM_NAME" in iphoneos|iphonesimulator) ;; *) exit 0 ;; esac\n/bin/bash "$EXPO_APP_ROOT/.expo-source/embed-frameworks.sh"\n',
  });
  const frameworks = [host, expo, core, jsi, provider, codegen, ...nativeModules];
  const sources = frameworks
    .map((target) => `$BUILT_PRODUCTS_DIR/${project.object(target).name}.framework`)
    .concat(
      runtimePaths.map(
        (path, index) =>
          `$EXPO_APP_ROOT/.expo-source/runtime/$EXPO_RUNTIME_CONFIGURATION/${path}/$EXPO_RUNTIME_SLICE/${runtimeNames[index]}.framework`
      )
    );
  await writeGenerated(
    join(gen, 'embed-frameworks.sh'),
    `set -eu
case "$PLATFORM_NAME" in iphoneos|iphonesimulator) ;; *) exit 0 ;; esac
/bin/bash "$EXPO_APP_ROOT/.expo-source/scripts/embed-frameworks.sh" ${sources.map((source) => `"${source}"`).join(' ')}
export NODE_BINARY=${shellQuote(node)}
export PROJECT_ROOT="$EXPO_APP_ROOT/expo"
export EXPO_CONSTANTS_ALLOW_NON_PODS=1
export EXPO_CONSTANTS_APP_CONFIG_DEST="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
/bin/bash ${shellQuote(join(packageRoot('expo-constants', expoRoot), 'scripts/get-app-config-ios.sh'))}
`
  );
  await appProject.save(join(options.project, 'project.pbxproj'));
  process.stdout.write(
    `Configured ${appProject.object(app).name} with the generated ${join(gen, 'ExpoEmbedding.xcodeproj')} subproject\n`
  );
}
