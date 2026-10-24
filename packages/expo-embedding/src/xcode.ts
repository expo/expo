import { parse, build } from '@bacons/xcode/json';
import { createHash } from 'node:crypto';

import { readText, writeGenerated } from './files';

type PBXObject = { isa: string; [key: string]: any };
type PBXData = {
  archiveVersion: number;
  objectVersion: number;
  classes: Record<string, unknown>;
  objects: Record<string, PBXObject>;
  rootObject: string;
};
export const shellQuote = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;
export function splitFlags(value: string): string[] {
  const words: string[] = [];
  let current = '';
  let quote = '';
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === '\\' && quote !== "'") {
      current += value[++index] ?? '';
    } else if (quote) {
      if (char === quote) quote = '';
      else current += char;
    } else if (char === '"' || char === "'") quote = char;
    else if (/\s/.test(char)) {
      if (current) words.push(current);
      current = '';
    } else current += char;
  }
  if (quote)
    throw new Error(
      'Unterminated quote in host linker flags. Fix OTHER_LDFLAGS in Xcode and rerun init.'
    );
  if (current) words.push(current);
  return words;
}

export class Project {
  constructor(readonly data: PBXData) {}
  static parse(contents: string): Project {
    return new Project(parse(contents) as PBXData);
  }
  static async open(path: string): Promise<Project> {
    return Project.parse(await readText(path));
  }
  static create(configurations = ['Debug', 'Release']): Project {
    const project = new Project({
      archiveVersion: 1,
      objectVersion: 56,
      classes: {},
      objects: {},
      rootObject: '',
    });
    const products = project.add('PBXGroup', 'products', {
      children: [],
      name: 'Products',
      sourceTree: '<group>',
    });
    const main = project.add('PBXGroup', 'main', {
      children: [products],
      sourceTree: '<group>',
    });
    project.data.rootObject = project.add('PBXProject', 'root', {
      attributes: { LastUpgradeCheck: '1600' },
      buildConfigurationList: project.addConfigurations('project', configurations),
      compatibilityVersion: 'Xcode 14.0',
      developmentRegion: 'en',
      hasScannedForEncodings: 0,
      knownRegions: ['en', 'Base'],
      mainGroup: main,
      productRefGroup: products,
      projectDirPath: '',
      projectRoot: '',
      targets: [],
    });
    return project;
  }
  get root(): PBXObject {
    return this.object(this.data.rootObject);
  }
  object(id: string): PBXObject {
    const value = this.data.objects[id];
    if (!value)
      throw new Error(
        `Xcode project contains a missing object ${id}. Repair the project before rerunning init.`
      );
    return value;
  }
  entries(isa: string): [string, PBXObject][] {
    return Object.entries(this.data.objects).filter(([, value]) => value.isa === isa);
  }
  add(isa: string, key: string, properties: Record<string, any>): string {
    const id = createHash('sha256')
      .update(`expo-embedding:${isa}:${key}`)
      .digest('hex')
      .slice(0, 24)
      .toUpperCase();
    if (this.data.objects[id]) throw new Error(`Duplicate generated Xcode object ${isa}: ${key}`);
    this.data.objects[id] = { isa, ...properties };
    return id;
  }
  addConfigurations(key: string, names: string[]): string {
    return this.add('XCConfigurationList', key, {
      buildConfigurations: names.map((name) =>
        this.add('XCBuildConfiguration', `${key}:${name}`, { name, buildSettings: {} })
      ),
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName: names.includes('Release') ? 'Release' : names[0],
    });
  }
  configurations(target = this.data.rootObject): PBXObject[] {
    return this.object(this.object(target).buildConfigurationList).buildConfigurations.map(
      (id: string) => this.object(id)
    );
  }
  addTarget(name: string, productType: string, configurations: string[]): string {
    const framework = productType === 'com.apple.product-type.framework';
    const product = this.add('PBXFileReference', `product:${name}`, {
      explicitFileType: framework ? 'wrapper.framework' : 'wrapper.application',
      includeInIndex: 0,
      path: `${name}.${framework ? 'framework' : 'app'}`,
      sourceTree: 'BUILT_PRODUCTS_DIR',
    });
    this.object(this.root.productRefGroup).children.push(product);
    const target = this.add('PBXNativeTarget', name, {
      name,
      productName: name,
      productType,
      productReference: product,
      buildConfigurationList: this.addConfigurations(`target:${name}`, configurations),
      buildPhases: [],
      buildRules: [],
      dependencies: [],
    });
    this.root.targets.push(target);
    for (const isa of [
      'PBXSourcesBuildPhase',
      'PBXFrameworksBuildPhase',
      'PBXResourcesBuildPhase',
      ...(framework ? ['PBXHeadersBuildPhase'] : []),
    ])
      this.addPhase(target, isa);
    return target;
  }
  addPhase(target: string, isa: string, name?: string, props: Record<string, any> = {}): string {
    const id = this.add(isa, `${this.object(target).name}:${name ?? isa}`, {
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
      ...(name ? { name } : {}),
      ...props,
    });
    this.object(target).buildPhases.push(id);
    return id;
  }
  phase(target: string, isa: string): string {
    return (
      this.object(target).buildPhases.find((id: string) => this.object(id).isa === isa) ??
      this.addPhase(target, isa)
    );
  }
  addFile(group: string, path: string, fileType?: string, sourceTree = '<absolute>'): string {
    const existing = this.object(group).children.find((id: string) => {
      const file = this.object(id);
      return (
        file.isa === 'PBXFileReference' && file.path === path && file.sourceTree === sourceTree
      );
    });
    if (existing) return existing;
    const types: Record<string, string> = {
      swift: 'sourcecode.swift',
      h: 'sourcecode.c.h',
      m: 'sourcecode.c.objc',
      mm: 'sourcecode.cpp.objcpp',
      c: 'sourcecode.c.c',
      cpp: 'sourcecode.cpp.cpp',
      cc: 'sourcecode.cpp.cpp',
      xcprivacy: 'text.xml',
      json: 'text.json',
      xcodeproj: 'wrapper.pb-project',
    };
    const ref = this.add('PBXFileReference', `${group}:${path}`, {
      path,
      sourceTree,
      lastKnownFileType: fileType ?? types[path.split('.').at(-1)!] ?? 'text',
    });
    this.object(group).children.push(ref);
    return ref;
  }
  addBuildFile(phase: string, ref: string, settings?: Record<string, any>): string {
    const id = this.add('PBXBuildFile', `${phase}:${ref}`, {
      fileRef: ref,
      ...(settings ? { settings } : {}),
    });
    this.object(phase).files.push(id);
    return id;
  }
  depend(target: string, dependency: string): void {
    const proxy = this.add('PBXContainerItemProxy', `${target}:${dependency}`, {
      containerPortal: this.data.rootObject,
      proxyType: 1,
      remoteGlobalIDString: dependency,
      remoteInfo: this.object(dependency).name,
    });
    const id = this.add('PBXTargetDependency', `${target}:${dependency}`, {
      target: dependency,
      targetProxy: proxy,
    });
    this.object(target).dependencies.push(id);
    this.addBuildFile(
      this.phase(target, 'PBXFrameworksBuildPhase'),
      this.object(dependency).productReference
    );
  }
  serialize(): string {
    return build(this.data as any);
  }
  async save(path: string): Promise<void> {
    await writeGenerated(path, this.serialize());
  }
}

const subprojectPath = '.expo-source/ExpoEmbedding.xcodeproj';
export function selectHost(project: Project, targetName: string, mappings: Record<string, string>) {
  const apps = project.root.targets.filter(
    (id: string) => project.object(id).productType === 'com.apple.product-type.application'
  );
  const target = targetName
    ? apps.find((id: string) => project.object(id).name === targetName)
    : apps.length === 1
      ? apps[0]
      : undefined;
  if (!target)
    throw new Error(
      'Could not select the app target. Pass --target with an application target name.'
    );
  const configurations: Record<string, string> = {
    Debug: 'Debug',
    Release: 'Release',
    ...mappings,
  };
  for (const config of project.configurations(target)) {
    if (!['Debug', 'Release'].includes(configurations[config.name]))
      throw new Error(
        `Configuration ${config.name} needs a runtime mapping. Add "configurations": { "${config.name}": "Debug" or "Release" } to expo-embedding.json and rerun init.`
      );
  }
  const existing = project
    .entries('PBXFileReference')
    .find(([, ref]) => ref.path === subprojectPath);
  const hasDependency = project
    .object(target)
    .dependencies.some((id: string) => project.object(id).name === 'expoappbrownfield');
  if (existing && !hasDependency)
    throw new Error(
      'This project already has an Expo subproject attached to another target. Select that application target with --target; each integration supports one application target.'
    );
  if (
    !existing &&
    (project.entries('PBXNativeTarget').some(([, target]) => target.name === 'expoappbrownfield') ||
      project
        .object(target)
        .buildPhases.some((id: string) => project.object(id).name === 'Embed Expo Frameworks'))
  ) {
    throw new Error(
      'An existing Expo integration conflicts with this setup. Remove the old integration explicitly, then rerun init. No targets or build phases were deleted.'
    );
  }
  return { target, configurations };
}

export function attachSubproject(
  host: Project,
  target: string,
  subproject: Project,
  framework: string
): void {
  let ref = host
    .entries('PBXFileReference')
    .find(([, value]) => value.path === subprojectPath)?.[0];
  if (!ref)
    ref = host.addFile(host.root.mainGroup, subprojectPath, 'wrapper.pb-project', '<group>');
  let reference = (host.root.projectReferences ??= []).find(
    (entry: any) => entry.ProjectRef === ref
  );
  if (!reference) {
    reference = {
      ProjectRef: ref,
      ProductGroup: host.add('PBXGroup', 'expo-subproject-products', {
        children: [],
        name: 'Products',
        sourceTree: '<group>',
      }),
    };
    host.root.projectReferences.push(reference);
  }
  const product = subproject.object(framework).productReference;
  let proxy = host
    .entries('PBXReferenceProxy')
    .find(
      ([, value]) =>
        value.path === 'expoappbrownfield.framework' &&
        host.object(value.remoteRef).containerPortal === ref
    )?.[0];
  if (!proxy) {
    const remoteRef = host.add('PBXContainerItemProxy', 'expo-host-product', {
      containerPortal: ref,
      proxyType: 2,
      remoteGlobalIDString: product,
      remoteInfo: 'expoappbrownfield',
    });
    proxy = host.add('PBXReferenceProxy', 'expo-host-product', {
      path: 'expoappbrownfield.framework',
      fileType: 'wrapper.framework',
      sourceTree: 'BUILT_PRODUCTS_DIR',
      remoteRef,
    });
    host.object(reference.ProductGroup).children.push(proxy);
  }
  host.object(host.object(proxy).remoteRef).remoteGlobalIDString = product;
  let dependency = host
    .object(target)
    .dependencies.find((id: string) => host.object(id).name === 'expoappbrownfield');
  if (!dependency) {
    const targetProxy = host.add('PBXContainerItemProxy', 'expo-host-target', {
      containerPortal: ref,
      proxyType: 1,
      remoteGlobalIDString: framework,
      remoteInfo: 'expoappbrownfield',
    });
    dependency = host.add('PBXTargetDependency', 'expo-host-target', {
      name: 'expoappbrownfield',
      targetProxy,
      platformFilter: 'ios',
    });
    host.object(target).dependencies.push(dependency);
  }
  host.object(host.object(dependency).targetProxy).remoteGlobalIDString = framework;
  // Only the host product is exposed across the project boundary.
  for (const [id, value] of host.entries('PBXReferenceProxy')) {
    if (host.object(value.remoteRef).containerPortal !== ref || id === proxy) continue;
    host.object(reference.ProductGroup).children = host
      .object(reference.ProductGroup)
      .children.filter((child: string) => child !== id);
    delete host.data.objects[value.remoteRef];
    delete host.data.objects[id];
  }
  const phase = host.object(host.phase(target, 'PBXFrameworksBuildPhase'));
  phase.files = phase.files.filter((id: string) => {
    const file = host.data.objects[host.object(id).fileRef];
    if (file?.path !== 'expoappbrownfield.framework') return true;
    delete host.data.objects[id];
    return false;
  });
}
