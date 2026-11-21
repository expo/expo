import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { configureSourceProject, validateSourceProject } from '../configure-source';
import { Project } from '../xcode';

describe('Generating iOS host integration', () => {
  let root: string;
  let options: Parameters<typeof configureSourceProject>[0];
  let plan: Parameters<typeof configureSourceProject>[1];
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'expo ios generation '));
    options = {
      root,
      project: join(root, 'App.xcodeproj'),
      target: 'App',
      node: process.execPath,
      templates: resolve(__dirname, '../../templates/ios'),
    };
    const host = Project.create();
    const target = host.addTarget('App', 'com.apple.product-type.application', [
      'Debug',
      'Release',
    ]);
    for (const config of host.configurations(target)) {
      Object.assign(config.buildSettings, {
        OTHER_LDFLAGS: '-lz -framework UserKit',
        HEADER_SEARCH_PATHS: ['$(inherited)', '"$(SRCROOT)/User Headers"'],
        FRAMEWORK_SEARCH_PATHS: ['$(inherited)', '"$(SRCROOT)/User Frameworks"'],
      });
    }
    await host.save(join(options.project, 'project.pbxproj'));
    for (const name of [
      'expo',
      'react-native',
      'expo-modules-core',
      'expo-modules-jsi',
      'expo-modules-macros',
      'expo-constants',
    ]) {
      const directory = join(root, 'expo/node_modules', name);
      await mkdir(join(directory, 'scripts'), { recursive: true });
      await writeFile(join(directory, 'package.json'), JSON.stringify({ name, version: '58.0.0' }));
    }
    plan = {
      expoRoot: join(root, 'expo/node_modules/expo'),
      reactNativeRoot: join(root, 'expo/node_modules/react-native'),
      modules: [],
    } as unknown as typeof plan;
    // Match Expo's resolver argv contract, including a custom main and resolver failures.
    await writeFile(
      join(plan.expoRoot, 'scripts/resolveAppEntry.js'),
      `const fs = require('node:fs'); const path = require('node:path');\n` +
        `if (process.argv[2] !== 'ios' || process.argv[3] !== 'absolute') process.exit(41);\n` +
        `const entry = path.join(process.argv[1], JSON.parse(fs.readFileSync(path.join(process.argv[1], 'package.json'))).main);\n` +
        `if (!fs.existsSync(entry)) process.exit(42);\nconsole.log(entry);\n`
    );
    await writeFile(join(root, 'expo/package.json'), '{"main":"features.js"}');
    await writeFile(join(root, 'expo/features.js'), '');
    await writeFile(
      join(plan.reactNativeRoot, 'scripts/react-native-xcode.sh'),
      'printf "%s" "$ENTRY_FILE"'
    );
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function bundle(configuration = 'Debug') {
    await configureSourceProject(options, plan);
    const project = await Project.open(
      join(root, '.expo-source/ExpoEmbedding.xcodeproj/project.pbxproj')
    );
    const [, phase] = project
      .entries('PBXShellScriptBuildPhase')
      .find(([, phase]) => phase.name === 'Bundle Expo JavaScript')!;
    return promisify(execFile)(phase.shellPath, ['-c', phase.shellScript], {
      env: {
        ...process.env,
        EXPO_APP_ROOT: root,
        CONFIGURATION: 'Debug',
        PLATFORM_NAME: 'iphonesimulator',
        EXPO_RUNTIME_CONFIGURATION: configuration,
        CONFIGURATION_BUILD_DIR: root,
        UNLOCALIZED_RESOURCES_FOLDER_PATH: 'framework',
        ENTRY_FILE: '',
      },
    });
  }

  it('should bundle the custom app entry with paths containing spaces', async () => {
    expect((await bundle()).stdout).toBe(join(root, 'expo/features.js'));
  });

  it('should stop before bundling when entry resolution fails', async () => {
    await rm(join(root, 'expo/features.js'));
    await expect(bundle()).rejects.toMatchObject({ code: 42 });
  });

  it('should identify the Metro project only in development configurations', async () => {
    await bundle();
    const identity = join(root, 'framework/expo-project-root.txt');
    expect((await readFile(identity, 'utf8')).trim()).toBe(await realpath(join(root, 'expo')));
    await bundle('Release');
    await expect(readFile(identity)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('should preserve target search paths and linker flags across repeat setup', async () => {
    const original = await Project.open(join(options.project, 'project.pbxproj'));
    const app = original.entries('PBXNativeTarget')[0][0];
    original.configurations(app)[1].buildSettings.LD_RUNPATH_SEARCH_PATHS =
      '$(inherited) "@executable_path/Custom Frameworks"';
    await original.save(join(options.project, 'project.pbxproj'));
    await configureSourceProject(options, plan);
    const before = await readFile(join(options.project, 'project.pbxproj'), 'utf8');
    await configureSourceProject(options, plan);
    expect(await readFile(join(options.project, 'project.pbxproj'), 'utf8')).toBe(before);
    const host = await Project.open(join(options.project, 'project.pbxproj'));
    for (const config of host.configurations(host.entries('PBXNativeTarget')[0][0])) {
      expect(config.buildSettings['LD_RUNPATH_SEARCH_PATHS[sdk=iphone*]']).toEqual(
        config.name === 'Debug'
          ? ['$(inherited)', '@executable_path/Frameworks']
          : ['$(inherited)', '@executable_path/Custom Frameworks', '@executable_path/Frameworks']
      );
      expect(config.buildSettings['OTHER_LDFLAGS[sdk=iphone*]']).toEqual(
        expect.arrayContaining(['-lz', '-framework', 'UserKit'])
      );
      expect(config.buildSettings['HEADER_SEARCH_PATHS[sdk=iphone*]']).toContain(
        '"$(SRCROOT)/User Headers"'
      );
      expect(config.buildSettings['FRAMEWORK_SEARCH_PATHS[sdk=iphone*]']).toContain(
        '"$(SRCROOT)/User Frameworks"'
      );
    }
  });

  it('should reject a project outside the integration root before generating files', async () => {
    const nested = join(root, 'ios/App.xcodeproj');
    await mkdir(join(root, 'ios'));
    await mkdir(nested);
    await writeFile(
      join(nested, 'project.pbxproj'),
      await readFile(join(options.project, 'project.pbxproj'))
    );
    await expect(validateSourceProject({ ...options, project: nested })).rejects.toThrow(
      'directory containing'
    );
  });
});
