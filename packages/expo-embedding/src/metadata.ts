import { minimatch } from 'minimatch';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

import { exists, lstatIfExists } from './files';
import { readPodspec } from './podspec';
import { readCommandOutput } from './process';

type Settings = {
  cFlags: string[];
  cxxFlags: string[];
  swiftFlags: string[];
  linkerFlags: string[];
};
export type NativeTarget = {
  name: string;
  files: string[];
  publicHeaders: string[];
  resources: string[];
  resourceAccessor: boolean;
  headerSearchPaths: string[];
  dependencies: string[];
  frameworks: string[];
  swiftVersion: string;
  deploymentTarget: string;
  settings: { Debug: Settings; Release: Settings };
};
export type NativeBuild = {
  source: string;
  targets: NativeTarget[];
  manifestHash?: string;
};
type ObjectValue = Record<string, any>;

function unsupported(detail: string): never {
  throw new Error(
    `Unsupported native build metadata: ${detail}. Use supported source metadata or extend the embedding adapter before rerunning init.`
  );
}

function keys(value: ObjectValue, allowed: string[], context: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) unsupported(`${context}.${key}`);
  }
}

function strings(value: unknown): string[] {
  if (value == null) return [];
  const result = Array.isArray(value) ? value : [value];
  if (result.some((item) => typeof item !== 'string'))
    unsupported('expected a string or string array');
  return result as string[];
}

function identifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) unsupported(`module or framework name ${value}`);
  return value;
}

async function localPath(root: string, base: string, path: string): Promise<string> {
  const full = resolve(base, path);
  const rel = relative(root, full);
  if (isAbsolute(path) || rel === '..' || rel.startsWith('../'))
    unsupported(`path outside package: ${path}`);
  for (let candidate = full; candidate !== resolve(root); candidate = dirname(candidate)) {
    if ((await lstatIfExists(candidate))?.isSymbolicLink()) {
      unsupported(`source symlink ${candidate}`);
    }
  }
  return full;
}

async function walk(directory: string): Promise<string[]> {
  if (!(await exists(directory))) unsupported(`missing source directory ${directory}`);
  const paths: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.build', 'build', '.git'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) unsupported(`source symlink ${path}`);
    paths.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return paths;
}

function matches(path: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) =>
      path === pattern ||
      path.startsWith(pattern.replace(/\/$/, '') + '/') ||
      minimatch(path, pattern, { dot: true, nonegate: true })
  );
}

async function files(
  root: string,
  base: string,
  patterns: string[],
  excludes: string[] = []
): Promise<string[]> {
  for (const pattern of [...patterns, ...excludes]) await localPath(root, base, pattern);
  return (await walk(base))
    .filter((file) => {
      const path = relative(base, file);
      return matches(path, patterns) && !matches(path, excludes);
    })
    .sort();
}

async function resources(root: string, base: string, entries: ObjectValue[]): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of entries) {
    keys(entry, ['path', 'rule'], 'resource');
    const rule =
      typeof entry.rule === 'string' ? entry.rule : Object.keys(entry.rule ?? { copy: {} })[0];
    if (rule !== 'copy') unsupported(`resource rule ${rule}; this adapter currently supports copy`);
    const path = await localPath(root, base, entry.path);
    if (await exists(path)) {
      paths.push(path);
      continue;
    }
    const matched = await files(root, base, [entry.path]);
    if (!matched.length) unsupported(`resource pattern ${entry.path} matches no files`);
    paths.push(...matched);
  }
  return paths;
}

function swiftVersion(value: unknown): string {
  const versions = strings(value);
  if (!versions.length) return '5.0';
  const version = versions[versions.length - 1];
  if (/^5(?:\.\d+)?$/.test(version)) return '5.0';
  if (/^6(?:\.0)?$/.test(version)) return '6.0';
  return unsupported(`Swift language version ${version}`);
}

function target(name: string, version?: unknown, deploymentTarget = '16.4'): NativeTarget {
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(deploymentTarget))
    unsupported(`iOS deployment target ${deploymentTarget}`);
  if (
    Number(deploymentTarget.split('.')[0]) > 16 ||
    (deploymentTarget.startsWith('16.') && Number(deploymentTarget.split('.')[1]) > 4)
  ) {
    unsupported(
      `iOS deployment target ${deploymentTarget} exceeds the embedding host's 16.4 floor`
    );
  }
  const settings = (): Settings => ({
    cFlags: [],
    cxxFlags: [],
    swiftFlags: [],
    linkerFlags: [],
  });
  return {
    name: identifier(name),
    files: [],
    publicHeaders: [],
    resources: [],
    resourceAccessor: false,
    headerSearchPaths: [],
    dependencies: [],
    frameworks: [],
    swiftVersion: swiftVersion(version),
    deploymentTarget: '16.4',
    settings: { Debug: settings(), Release: settings() },
  };
}

const sourcePattern = /\.(swift|m|mm|c|cc|cpp|h)$/;
const runtimeAliases: Record<string, string> = {
  Hermes: 'hermesvm',
  'hermes-engine': 'hermesvm',
  'React-Core': 'React',
};
export function dependencyName(name: string): string {
  return Object.hasOwn(runtimeAliases, name) ? runtimeAliases[name] : name.split('/').at(-1)!;
}

function finish(build: NativeBuild): NativeBuild {
  const names = new Set<string>();
  for (const item of build.targets) {
    if (names.has(item.name)) unsupported(`duplicate target ${item.name}`);
    names.add(item.name);
    for (const field of [
      'files',
      'publicHeaders',
      'resources',
      'headerSearchPaths',
      'dependencies',
      'frameworks',
    ] as const) {
      item[field] = [...new Set(item[field])].sort();
    }
    item.files = item.files.filter(
      (file) =>
        !item.resources.some((resource) => file === resource || file.startsWith(resource + '/'))
    );
    item.publicHeaders = item.publicHeaders.filter((file) => item.files.includes(file));
    item.dependencies = item.dependencies.filter((name) => name !== item.name);
    if (!item.files.some((file) => !file.endsWith('.h')))
      unsupported(`target ${item.name} has no compilable sources`);
    for (const paths of [item.publicHeaders, item.resources]) {
      if (new Set(paths.map((path) => basename(path).toLowerCase())).size !== paths.length)
        unsupported(`target ${item.name} has colliding header or resource basenames`);
    }
  }
  if (!build.targets.length) unsupported(`${build.source} declares no source targets`);
  return build;
}

export async function fromSpmConfig(root: string, config: ObjectValue): Promise<NativeBuild> {
  keys(config, ['$schema', 'publishPrebuilds', 'products'], 'spm.config.json');
  const targets: NativeTarget[] = [];
  for (const product of config.products ?? []) {
    keys(
      product,
      ['name', 'podName', 'platforms', 'externalDependencies', 'swiftLanguageVersions', 'targets'],
      `product ${product.name}`
    );
    const ios = strings(product.platforms).find((value) => value.startsWith('iOS('));
    const minimum =
      ios?.match(/^iOS\("(\d+\.\d+(?:\.\d+)?)"\)$/)?.[1] ??
      ios?.match(/^iOS\(\.v(\d+)\)$/)?.[1]?.concat('.0');
    if (product.platforms?.length && !minimum)
      unsupported(`product ${product.name} has no supported iOS platform declaration`);
    const aliases = new Map<string, string>(
      (product.targets ?? []).map((item: ObjectValue) => [
        item.name,
        item.moduleName ?? (item.type === 'swift' ? item.name : product.name),
      ])
    );
    const groups = new Map<string, NativeTarget>();
    for (const input of product.targets ?? []) {
      keys(
        input,
        [
          'name',
          'moduleName',
          'type',
          'path',
          'pattern',
          'headerPattern',
          'dependencies',
          'exclude',
          'includeDirectories',
          'linkedFrameworks',
          'resources',
          'compilerFlags',
          'linkerFlags',
          'publicHeaders',
        ],
        `target ${input.name}`
      );
      if (!['swift', 'objc', 'cpp'].includes(input.type)) unsupported(`target type ${input.type}`);
      const name = aliases.get(input.name)!;
      const item = groups.get(name) ?? target(name, product.swiftLanguageVersions, minimum);
      groups.set(name, item);
      const base = await localPath(root, root, input.path ?? '');
      const patterns = input.pattern
        ? [input.pattern]
        : [input.type === 'swift' ? '**/*.swift' : '**/*.{m,mm,c,cc,cpp}'];
      const excludes = ['**/Tests/**', ...strings(input.exclude)];
      const selected = await files(root, base, patterns, excludes);
      if (selected.some((file) => !sourcePattern.test(file)))
        unsupported(`non-source file in target ${input.name}`);
      const headers = await files(root, base, [input.headerPattern ?? '**/*.h'], excludes);
      item.files.push(...selected, ...headers);
      if (input.publicHeaders !== false) item.publicHeaders.push(...headers);
      item.headerSearchPaths.push(
        base,
        ...(await Promise.all(
          strings(input.includeDirectories).map((path) => localPath(root, base, path))
        ))
      );
      item.dependencies.push(
        ...[...strings(input.dependencies), ...strings(product.externalDependencies)].map(
          (name) => aliases.get(name) ?? dependencyName(name)
        )
      );
      item.frameworks.push(...strings(input.linkedFrameworks).map(identifier));
      item.resources.push(...(await resources(root, root, input.resources ?? [])));
      item.resourceAccessor ||= (input.resources?.length ?? 0) > 0;
      for (const mode of ['Debug', 'Release'] as const) {
        const flags = input.compilerFlags;
        if (flags != null && !Array.isArray(flags))
          unsupported(`target ${input.name}.compilerFlags variants`);
        item.settings[mode].cFlags.push(...strings(flags));
        item.settings[mode].cxxFlags.push(...strings(flags));
        if (input.type === 'swift')
          item.settings[mode].swiftFlags.push(...strings(flags).flatMap((flag) => ['-Xcc', flag]));
        item.settings[mode].linkerFlags.push(...strings(input.linkerFlags));
      }
    }
    targets.push(...groups.values());
  }
  return finish({ source: 'spm.config.json', targets });
}

function swiftConditions(condition: ObjectValue = {}): ('Debug' | 'Release')[] {
  keys(condition, ['platformNames', 'config'], 'Swift build condition');
  if (condition.platformNames?.length && !condition.platformNames.includes('ios')) return [];
  if (condition.config && !['debug', 'release'].includes(condition.config))
    unsupported(`configuration ${condition.config}`);
  return condition.config
    ? [condition.config === 'debug' ? 'Debug' : 'Release']
    : ['Debug', 'Release'];
}

export async function fromSwiftPackage(root: string, manifest: ObjectValue): Promise<NativeBuild> {
  keys(
    manifest,
    [
      'name',
      'products',
      'targets',
      'dependencies',
      'platforms',
      'swiftLanguageVersions',
      'cLanguageStandard',
      'cxxLanguageStandard',
      'defaultLocalization',
      'packageKind',
      'pkgConfig',
      'providers',
      'toolsVersion',
      'traits',
    ],
    'Package.swift'
  );
  for (const key of ['dependencies', 'traits', 'providers'])
    if (manifest[key]?.length) unsupported(`Package.swift ${key}`);
  for (const key of ['defaultLocalization', 'pkgConfig'])
    if (manifest[key]) unsupported(`Package.swift ${key}`);
  if (
    manifest.cLanguageStandard ||
    (manifest.cxxLanguageStandard && manifest.cxxLanguageStandard !== 'c++20')
  )
    unsupported('Package.swift language standards');
  for (const product of manifest.products ?? []) {
    if (!product.type?.library || !['automatic', 'dynamic'].includes(product.type.library[0]))
      unsupported(`product ${product.name} type`);
    if (product.settings?.length) unsupported(`product ${product.name} settings`);
  }
  const inputs = (manifest.targets ?? []).filter((item: ObjectValue) => item.type !== 'test');
  const minimum = manifest.platforms?.find(
    (platform: ObjectValue) => platform.platformName === 'ios'
  )?.version;
  const targets = await Promise.all(
    inputs.map(async (input: ObjectValue) => {
      if (input.type !== 'regular') unsupported(`Swift target ${input.name} type ${input.type}`);
      keys(
        input,
        [
          'name',
          'type',
          'path',
          'dependencies',
          'exclude',
          'sources',
          'resources',
          'publicHeadersPath',
          'settings',
          'packageAccess',
        ],
        `Swift target ${input.name}`
      );
      const language = manifest.swiftLanguageVersions ?? [
        Number(manifest.toolsVersion?._version?.split('.')[0] ?? 5) >= 6 ? '6' : '5',
      ];
      const item = target(input.name, language, minimum);
      let inferred: string | undefined;
      for (const directory of ['Sources', 'Source', 'src', 'srcs']) {
        if (await exists(join(root, directory, input.name))) {
          inferred = join(directory, input.name);
          break;
        }
      }
      if (!inferred && inputs.length === 1) {
        for (const directory of ['Sources', 'Source', 'src', 'srcs']) {
          if (await exists(join(root, directory))) {
            inferred = directory;
            break;
          }
        }
      }
      if (!input.path && !inferred) unsupported(`Swift target ${input.name} source path`);
      const base = await localPath(root, root, input.path ?? inferred);
      item.files = (await files(root, base, input.sources ?? ['**/*'], input.exclude ?? [])).filter(
        (file) => sourcePattern.test(file)
      );
      const publicPath = await localPath(root, base, input.publicHeadersPath ?? 'include');
      if (await exists(join(publicPath, 'module.modulemap')))
        unsupported(`Swift target ${input.name} custom module.modulemap`);
      item.publicHeaders = (await exists(publicPath))
        ? (await files(root, publicPath, ['**/*.h'])).filter(
            (file) => !matches(relative(base, file), input.exclude ?? [])
          )
        : [];
      item.files.push(...item.publicHeaders);
      item.headerSearchPaths = [base, ...item.publicHeaders.map(dirname)];
      item.resources = await resources(root, base, input.resources ?? []);
      item.resourceAccessor = item.resources.length > 0;
      for (const mode of ['Debug', 'Release'] as const) {
        item.settings[mode].cFlags.push('-DSWIFT_PACKAGE');
        item.settings[mode].cxxFlags.push('-DSWIFT_PACKAGE');
        item.settings[mode].swiftFlags.push(
          '-DSWIFT_PACKAGE',
          '-Xcc',
          '-DSWIFT_PACKAGE',
          '-package-name',
          identifier(manifest.name.replace(/[^A-Za-z0-9_]/g, '_'))
        );
      }
      for (const dep of input.dependencies ?? []) {
        keys(dep, ['byName', 'target'], `Swift target ${input.name} dependency`);
        const [name, condition] = dep.byName ?? dep.target ?? [];
        if (condition?.config) unsupported('configuration-specific Swift target dependencies');
        if (swiftConditions(condition ?? {}).length) item.dependencies.push(dependencyName(name));
      }
      for (const setting of input.settings ?? []) {
        const [kind, wrapped] = Object.entries(setting.kind ?? {})[0] ?? [];
        const value = (wrapped as ObjectValue)?._0;
        for (const mode of swiftConditions(setting.condition)) {
          const settings = item.settings[mode];
          if (kind === 'linkedFramework' && setting.tool === 'linker')
            settings.linkerFlags.push('-framework', identifier(value));
          else if (kind === 'linkedLibrary' && setting.tool === 'linker')
            settings.linkerFlags.push(`-l${identifier(value)}`);
          else {
            const field = (
              {
                swift: 'swiftFlags',
                c: 'cFlags',
                cxx: 'cxxFlags',
                linker: 'linkerFlags',
              } as const
            )[setting.tool as 'swift'];
            if (!field) unsupported(`Swift setting tool ${setting.tool}`);
            if (kind === 'define' && setting.tool !== 'linker') settings[field].push(`-D${value}`);
            else if (kind === 'unsafeFlags') settings[field].push(...strings(value));
            else if (kind === 'headerSearchPath' && ['c', 'cxx'].includes(setting.tool))
              settings[field].push('-I', await localPath(root, base, value));
            else if (
              ['enableUpcomingFeature', 'enableExperimentalFeature'].includes(kind) &&
              setting.tool === 'swift'
            )
              settings.swiftFlags.push(
                kind === 'enableUpcomingFeature'
                  ? '-enable-upcoming-feature'
                  : '-enable-experimental-feature',
                value
              );
            else unsupported(`Swift setting ${setting.tool}.${kind}`);
          }
        }
      }
      return item;
    })
  );
  for (const product of manifest.products ?? []) {
    for (const name of product.targets ?? [])
      if (!targets.some((item: NativeTarget) => item.name === name))
        unsupported(`product ${product.name} references missing target ${name}`);
  }
  return finish({ source: 'Package.swift', targets });
}

export async function fromPodspec(
  root: string,
  base: string,
  spec: ObjectValue
): Promise<NativeBuild> {
  const ignored = [
    'version',
    'summary',
    'description',
    'license',
    'author',
    'authors',
    'homepage',
    'source',
    'documentation_url',
    'social_media_url',
    'static_framework',
    'tvos',
    'osx',
    'visionos',
    'watchos',
  ];
  const supported = [
    'name',
    'module_name',
    'source_files',
    'exclude_files',
    'public_header_files',
    'private_header_files',
    'resources',
    'frameworks',
    'weak_frameworks',
    'libraries',
    'dependencies',
    'platforms',
    'swift_version',
    'swift_versions',
    'pod_target_xcconfig',
    'requires_arc',
    'ios',
    'deployment_target',
  ];
  keys(spec, [...ignored, ...supported], 'podspec');
  keys(spec.ios ?? {}, supported, 'podspec.ios');
  const attributes = { ...spec, ...spec.ios };
  for (const field of [
    'source_files',
    'exclude_files',
    'resources',
    'frameworks',
    'weak_frameworks',
    'libraries',
    'public_header_files',
    'private_header_files',
  ]) {
    attributes[field] = [...strings(spec[field]), ...strings(spec.ios?.[field])];
  }
  attributes.dependencies = { ...spec.dependencies, ...spec.ios?.dependencies };
  attributes.pod_target_xcconfig = {
    ...spec.pod_target_xcconfig,
    ...spec.ios?.pod_target_xcconfig,
  };
  for (const [name, requirements] of Object.entries(attributes.dependencies)) {
    if (strings(requirements).length)
      unsupported(`podspec dependency version requirements for ${name}`);
  }
  if (
    attributes.requires_arc === false ||
    (attributes.requires_arc != null && attributes.requires_arc !== true)
  )
    unsupported('podspec requires_arc');
  if (spec.platforms && !spec.platforms.ios) unsupported('podspec does not support iOS');
  const item = target(
    attributes.module_name ?? attributes.name,
    attributes.swift_version ?? attributes.swift_versions,
    spec.platforms?.ios ?? spec.ios?.deployment_target
  );
  item.files = await files(
    root,
    base,
    strings(attributes.source_files),
    strings(attributes.exclude_files)
  );
  if (item.files.some((file) => !sourcePattern.test(file))) unsupported('podspec source file type');
  item.publicHeaders = item.files.filter(
    (file) =>
      file.endsWith('.h') &&
      (!attributes.public_header_files.length ||
        matches(relative(base, file), strings(attributes.public_header_files))) &&
      !matches(relative(base, file), strings(attributes.private_header_files))
  );
  item.resources = await resources(
    root,
    base,
    strings(attributes.resources).map((path) => ({ path, rule: 'copy' }))
  );
  item.headerSearchPaths = [base, ...item.files.filter((file) => file.endsWith('.h')).map(dirname)];
  item.dependencies = Object.keys(attributes.dependencies ?? {}).map(dependencyName);
  item.frameworks = strings(attributes.frameworks).map(identifier);
  const config = attributes.pod_target_xcconfig ?? {};
  keys(config, ['DEFINES_MODULE', 'SWIFT_COMPILATION_MODE'], 'pod_target_xcconfig');
  if (config.DEFINES_MODULE && config.DEFINES_MODULE !== 'YES')
    unsupported('pod_target_xcconfig.DEFINES_MODULE');
  if (config.SWIFT_COMPILATION_MODE && config.SWIFT_COMPILATION_MODE !== 'wholemodule')
    unsupported('pod_target_xcconfig.SWIFT_COMPILATION_MODE');
  for (const mode of ['Debug', 'Release'] as const) {
    item.settings[mode].linkerFlags.push(
      ...strings(attributes.weak_frameworks).flatMap((name) => [
        '-weak_framework',
        identifier(name),
      ]),
      ...strings(attributes.libraries).map((name) => `-l${identifier(name)}`)
    );
    if (config.SWIFT_COMPILATION_MODE === 'wholemodule')
      item.settings[mode].swiftFlags.push('-whole-module-optimization');
  }
  return finish({ source: '.podspec', targets: [item] });
}

export function validateBuildDependencies(targets: NativeTarget[], provided: string[]): void {
  const names = new Set(provided);
  for (const item of targets) {
    if (names.has(item.name)) unsupported(`duplicate target ${item.name}`);
    names.add(item.name);
  }
  const active = new Set<string>();
  const done = new Set<string>();
  const visit = (name: string) => {
    if (active.has(name)) unsupported(`dependency cycle at ${name}`);
    if (done.has(name)) return;
    active.add(name);
    for (const dep of targets.find((item) => item.name === name)?.dependencies ?? []) {
      if (!names.has(dep)) unsupported(`${name} requires unresolved native dependency ${dep}`);
      visit(dep);
    }
    active.delete(name);
    done.add(name);
  };
  targets.forEach((item) => visit(item.name));
}

export async function readNativeBuild(root: string, podspecs: string[]): Promise<NativeBuild> {
  if (await exists(join(root, 'Package.swift'))) {
    const { SDKROOT: _sdkroot, ...env } = process.env;
    const output = await readCommandOutput(
      'swift',
      ['package', '--package-path', root, 'dump-package'],
      {
        env,
        maxBuffer: 32 * 1024 * 1024,
      }
    );
    return {
      ...(await fromSwiftPackage(root, JSON.parse(output))),
      manifestHash: createHash('sha256')
        .update(await readFile(join(root, 'Package.swift')))
        .digest('hex'),
    };
  }
  if (await exists(join(root, 'spm.config.json'))) {
    const input = await readFile(join(root, 'spm.config.json'), 'utf8');
    return {
      ...(await fromSpmConfig(root, JSON.parse(input))),
      manifestHash: createHash('sha256').update(input).digest('hex'),
    };
  }
  if (podspecs.length !== 1)
    unsupported(`${root} needs one podspec or an explicit Swift build manifest`);
  const path = podspecs[0];
  return {
    ...(await fromPodspec(root, dirname(path), await readPodspec(root, path))),
    manifestHash: createHash('sha256')
      .update(await readFile(path))
      .digest('hex'),
  };
}
