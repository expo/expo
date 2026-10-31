import { basename, join } from 'node:path';

import { writeGenerated } from './files';
import { Project } from './xcode';

type Options = {
  project: Project;
  group: string;
  gen: string;
  names: string[];
  configurations: Record<string, string>;
  common: Record<string, any>;
};

export function frameworkTargets({ project, group, gen, names, configurations, common }: Options) {
  const targetIds = new Map<string, string>();
  const makeTarget = async (name: string, sourceFiles: string[], privateHeaders: string[] = []) => {
    const target = project.addTarget(name, 'com.apple.product-type.framework', names);
    targetIds.set(name, target);
    for (const config of project.configurations(target)) {
      const debug = configurations[config.name] === 'Debug';
      config.buildSettings = {
        ...structuredClone(common),
        PRODUCT_BUNDLE_IDENTIFIER: `dev.expo.source.${name}`,
        GCC_PREPROCESSOR_DEFINITIONS: [
          '$(inherited)',
          'RCT_NEW_ARCH_ENABLED=1',
          'USE_HERMES=1',
          debug ? 'DEBUG=1' : 'NDEBUG=1',
        ],
        EXPO_RUNTIME_CONFIGURATION: configurations[config.name],
        OTHER_SWIFT_FLAGS: ['$(inherited)', '-DRCT_NEW_ARCH_ENABLED'],
        SWIFT_ACTIVE_COMPILATION_CONDITIONS: debug ? ['DEBUG'] : [],
        SWIFT_COMPILATION_MODE: debug ? 'singlefile' : 'wholemodule',
        SWIFT_OPTIMIZATION_LEVEL: debug ? '-Onone' : '-O',
        ENABLE_NS_ASSERTIONS: debug ? 'YES' : 'NO',
        GCC_OPTIMIZATION_LEVEL: debug ? '0' : 's',
        DEBUG_INFORMATION_FORMAT: debug ? 'dwarf' : 'dwarf-with-dsym',
        ONLY_ACTIVE_ARCH: debug ? 'YES' : 'NO',
        ENABLE_TESTABILITY: debug ? 'YES' : 'NO',
      };
    }
    const subgroup = project.add('PBXGroup', `sources:${name}`, {
      children: [],
      name,
      sourceTree: '<group>',
    });
    project.object(group).children.push(subgroup);
    const files = [...new Set(sourceFiles)].sort();
    for (const file of files) {
      const ref = project.addFile(subgroup, file);
      project.addBuildFile(
        project.phase(
          target,
          file.endsWith('.h') ? 'PBXHeadersBuildPhase' : 'PBXSourcesBuildPhase'
        ),
        ref,
        file.endsWith('.h')
          ? { ATTRIBUTES: [privateHeaders.includes(file) ? 'Private' : 'Public'] }
          : undefined
      );
    }
    const headers = files.filter((file) => file.endsWith('.h') && !privateHeaders.includes(file));
    const umbrella = join(gen, 'headers', `${name}-umbrella.h`);
    await writeGenerated(
      umbrella,
      '#ifdef __OBJC__\n#import <Foundation/Foundation.h>\n#endif\n' +
        headers.map((file) => `#import <${name}/${basename(file)}>\n`).join('')
    );
    project.addBuildFile(
      project.phase(target, 'PBXHeadersBuildPhase'),
      project.addFile(subgroup, umbrella),
      { ATTRIBUTES: ['Public'] }
    );
    const modulemap = join(gen, 'headers', `${name}.modulemap`);
    await writeGenerated(
      modulemap,
      `framework module ${name} {\n umbrella header "${name}-umbrella.h"\n export *\n module * { export * }\n}\n`
    );
    for (const config of project.configurations(target))
      config.buildSettings.MODULEMAP_FILE = modulemap;
    return target;
  };
  const settings = (target: string) =>
    project.configurations(target).map((config) => config.buildSettings);
  const depend = (target: string, deps: string[]) =>
    [...new Set(deps)].forEach((dep) => project.depend(target, dep));
  return { makeTarget, settings, depend, targetIds };
}
