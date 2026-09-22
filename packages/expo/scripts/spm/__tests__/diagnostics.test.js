'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  UnsupportedModulesError,
  UNMAPPED_POD_ALLOWLIST,
  classifyUnsupported,
  podspecDependencies,
  unmappedPodDependencies,
  renderUnsupportedReport,
  reportUnsupported,
  renderUnmappedDependencyWarning,
  collectRootConflicts,
  renderRootConflictWarning,
  renderExtraPodsWarning,
} = require('../diagnostics');
const { resolvePodIdentities } = require('../plugin');

describe('classifyUnsupported', () => {
  it('reports a missing interface tree once, not per module', () => {
    const entries = classifyUnsupported({
      pending: [
        { podName: 'ExpoAudio', packageName: 'expo-audio', moduleRoot: '/m/expo-audio' },
        { podName: 'EXUpdates', packageName: 'expo-updates', moduleRoot: '/m/expo-updates' },
      ],
      coreAvailable: false,
    });
    expect(entries).toEqual([{ reason: 'core-unavailable', pods: ['ExpoAudio', 'EXUpdates'] }]);
  });

  it('classifies a mixed-language module with no checked-in manifest', () => {
    const [entry] = classifyUnsupported({
      pending: [
        {
          podName: 'ExpoAudio',
          packageName: 'expo-audio',
          moduleRoot: '/m/expo-audio',
          pureSwift: false,
          hasSources: true,
        },
      ],
      coreAvailable: true,
    });
    expect(entry).toMatchObject({ reason: 'mixed-no-manifest', podName: 'ExpoAudio' });
  });

  it('prefers the prebuild route when the module declares a prebuildable product', () => {
    const [entry] = classifyUnsupported({
      pending: [
        {
          podName: 'ExpoAudio',
          packageName: 'expo-audio',
          moduleRoot: '/m/expo-audio',
          pureSwift: false,
          hasSources: true,
          prebuildProduct: { name: 'ExpoAudio', sourceOnly: false },
        },
      ],
      coreAvailable: true,
    });
    expect(entry).toMatchObject({ reason: 'prebuild-available', podName: 'ExpoAudio' });
  });

  it('does not offer the prebuild route for a source-only product', () => {
    const [entry] = classifyUnsupported({
      pending: [
        {
          podName: 'ExpoModulesWorkletsAdapter',
          packageName: 'expo-modules-core',
          moduleRoot: '/m/expo-modules-core',
          pureSwift: false,
          hasSources: true,
          prebuildProduct: { name: 'ExpoModulesWorkletsAdapter', sourceOnly: true },
        },
      ],
      coreAvailable: true,
    });
    expect(entry).toMatchObject({ reason: 'mixed-no-manifest' });
  });

  it('classifies a module whose apple sources could not be located', () => {
    const [entry] = classifyUnsupported({
      pending: [
        {
          podName: 'ExpoWeird',
          packageName: 'expo-weird',
          moduleRoot: '/m/expo-weird',
          pureSwift: true,
          hasSources: false,
        },
      ],
      coreAvailable: true,
    });
    expect(entry).toMatchObject({ reason: 'no-apple-sources', podName: 'ExpoWeird' });
  });
});

describe('diagnostic priority', () => {
  it('asks for the prebuild first, even when the podspec also needs attention', () => {
    expect(
      classifyUnsupported({
        pending: [
          {
            podName: 'ExpoBad',
            packageName: 'expo-bad',
            moduleRoot: '/m/expo-bad',
            hasSources: true,
            prebuildProduct: { name: 'ExpoBad', sourceOnly: false },
            podspecLinkage: {
              file: '/m/expo-bad/ios/ExpoBad.podspec',
              line: 19,
              snippet: "s.frameworks = 'Photos'",
            },
          },
        ],
        coreAvailable: true,
      })
    ).toEqual([
      {
        reason: 'prebuild-available',
        podName: 'ExpoBad',
        packageName: 'expo-bad',
        moduleRoot: '/m/expo-bad',
        productName: 'ExpoBad',
      },
    ]);
  });
});

describe('diagnostic priority order', () => {
  const pending = (extra) => ({
    podName: 'ExpoBad',
    packageName: 'expo-bad',
    moduleRoot: '/m/expo-bad',
    hasSources: true,
    ...extra,
  });
  const reasonFor = (extra) =>
    classifyUnsupported({ pending: [pending(extra)], coreAvailable: true })[0].reason;
  const podspecLinkage = {
    file: '/m/expo-bad/ios/ExpoBad.podspec',
    line: 19,
    snippet: "s.frameworks = 'Photos'",
  };

  it('reports the linkage before targets whose sources it could not find', () => {
    expect(reasonFor({ podspecLinkage, unresolvedTargets: ['Main'] })).toBe(
      'needs-manifest-for-linkage'
    );
  });

  it('asks for the prebuild before reporting targets it could not resolve', () => {
    expect(
      reasonFor({
        unresolvedTargets: ['Main'],
        prebuildProduct: { name: 'ExpoBad', sourceOnly: false },
      })
    ).toBe('prebuild-available');
  });
});

describe('linkage declared in a podspec', () => {
  const podspecLinkage = {
    file: '/m/expo-bad/ios/ExpoBad.podspec',
    line: 19,
    snippet: "s.frameworks = 'Photos', 'PhotosUI'",
  };
  const entries = () =>
    classifyUnsupported({
      pending: [
        { podName: 'ExpoBad', packageName: 'expo-bad', moduleRoot: '/m/expo-bad', podspecLinkage },
      ],
      coreAvailable: true,
    });

  it('classifies a module whose linkage only its podspec declares', () => {
    expect(entries()).toEqual([
      {
        reason: 'needs-manifest-for-linkage',
        podName: 'ExpoBad',
        packageName: 'expo-bad',
        moduleRoot: '/m/expo-bad',
        ...podspecLinkage,
      },
    ]);
  });

  it('points at the line, and at the two ways to declare linkage instead', () => {
    const report = renderUnsupportedReport(entries());
    expect(report).toContain('error: Expo module "expo-bad" (pod ExpoBad)');
    expect(report).toContain('/m/expo-bad/ios/ExpoBad.podspec:19');
    expect(report).toContain("s.frameworks = 'Photos', 'PhotosUI'");
    expect(report).toContain('linkerSettings');
    expect(report).toContain('spm.config.json');
    expect(report).toContain('patch-package expo-bad');
  });
});

describe('podspecDependencies', () => {
  it('extracts single- and double-quoted dependency names', () => {
    const text = [
      'Pod::Spec.new do |s|',
      "  s.dependency 'ExpoModulesCore'",
      '  s.dependency "SDWebImage", "~> 5.19"',
      "  s.dependency 'SDWebImageWebPCoder'",
      'end',
    ].join('\n');
    expect(podspecDependencies(text)).toEqual([
      'ExpoModulesCore',
      'SDWebImage',
      'SDWebImageWebPCoder',
    ]);
  });

  it('ignores test-spec dependencies', () => {
    const text = [
      "  s.dependency 'ExpoModulesCore'",
      "  s.test_spec 'Tests' do |test_spec|",
      "    test_spec.dependency 'Quick'",
      "    test_spec.dependency 'Nimble'",
      '  end',
    ].join('\n');
    expect(podspecDependencies(text)).toEqual(['ExpoModulesCore']);
  });

  it('returns an empty list for a podspec with no dependencies', () => {
    expect(podspecDependencies('Pod::Spec.new do |s|\nend\n')).toEqual([]);
  });
});

describe('unmappedPodDependencies', () => {
  it('keeps third-party pods and drops the SwiftPM-covered families', () => {
    const deps = [
      'ExpoModulesCore',
      'EXManifests',
      'React-Core',
      'RCTRequired',
      'ReactCommon/turbomodule/core',
      'expo-dev-menu-interface',
      'SDWebImage',
      'ZXingObjC/OneD',
    ];
    expect(unmappedPodDependencies(deps)).toEqual(['SDWebImage', 'ZXingObjC/OneD']);
  });

  it('drops pods that are already known to resolve without a podspec', () => {
    expect(UNMAPPED_POD_ALLOWLIST.has('sqlite3')).toBe(true);
    expect(unmappedPodDependencies(['sqlite3', 'SDWebImage'])).toEqual(['SDWebImage']);
  });

  it('drops a dependency whose full name or root name is a resolved SwiftPM dependency', () => {
    expect(
      unmappedPodDependencies(
        ['SDWebImage', 'libavif', 'libavif/libdav1d', 'ZXingObjC/OneD'],
        new Set(['SDWebImage', 'libavif'])
      )
    ).toEqual(['ZXingObjC/OneD']);
  });
});

describe('renderUnsupportedReport', () => {
  it('tells a mixed-language module how to add a manifest, patch it, and upstream it', () => {
    const text = renderUnsupportedReport([
      {
        reason: 'mixed-no-manifest',
        podName: 'ExpoAudio',
        packageName: 'expo-audio',
        moduleRoot: '/m/expo-audio',
      },
    ]);
    expect(text).toContain('error: ');
    expect(text).toContain('expo-audio');
    expect(text).toContain('Package.swift');
    expect(text).toContain('patch-package expo-audio');
    expect(text).toContain('exclude');
  });

  it('names the app package.json exclude key verbatim so it can be copied', () => {
    const text = renderUnsupportedReport([
      {
        reason: 'mixed-no-manifest',
        podName: 'ExpoAudio',
        packageName: 'expo-audio',
        moduleRoot: '/m/expo-audio',
      },
    ]);
    expect(text).toContain('"expo": { "autolinking": { "exclude": ["expo-audio"] } }');
  });

  it('emits one error line per module so Xcode surfaces each', () => {
    const text = renderUnsupportedReport([
      { reason: 'mixed-no-manifest', podName: 'A', packageName: 'a', moduleRoot: '/m/a' },
      { reason: 'mixed-no-manifest', podName: 'B', packageName: 'b', moduleRoot: '/m/b' },
    ]);
    expect(text.split('\n').filter((l) => l.startsWith('error: '))).toHaveLength(2);
  });

  it('tells a prebuildable module to run et prebuild, not to write a manifest', () => {
    const text = renderUnsupportedReport([
      {
        reason: 'prebuild-available',
        podName: 'ExpoAudio',
        packageName: 'expo-audio',
        moduleRoot: '/m/expo-audio',
        productName: 'ExpoAudio',
      },
    ]);
    expect(text).toContain('error: ');
    // `et prebuild` builds both flavors when --flavor is omitted, and the plugin
    // requires a complete pair — so the message must not suggest a single flavor.
    expect(text).toContain('et prebuild expo-audio');
    expect(text).not.toContain('-f Debug');
    expect(text).not.toContain('patch-package');
  });

  it('names the scoped package verbatim, which et prebuild accepts', () => {
    const text = renderUnsupportedReport([
      {
        reason: 'prebuild-available',
        podName: 'ExpoUI',
        packageName: '@expo/ui',
        moduleRoot: '/m/expo-ui',
        productName: 'ExpoUI',
      },
    ]);
    expect(text).toContain('et prebuild @expo/ui');
  });

  it('offers spm.config.json as a route for a module that has none', () => {
    const text = renderUnsupportedReport([
      { reason: 'mixed-no-manifest', podName: 'ExpoGL', packageName: 'expo-gl', moduleRoot: '/m' },
    ]);
    expect(text).toContain('spm.config.json');
  });

  it('explains a missing interface tree without blaming the modules', () => {
    const text = renderUnsupportedReport([
      { reason: 'core-unavailable', pods: ['ExpoAudio', 'EXUpdates'] },
    ]);
    expect(text).toContain('error: ');
    expect(text).toContain('ExpoModulesCore');
    expect(text).toContain('et prebuild');
    expect(text).not.toContain('patch-package');
  });

  it('explains a module with no locatable apple sources', () => {
    const text = renderUnsupportedReport([
      {
        reason: 'no-apple-sources',
        podName: 'ExpoWeird',
        packageName: 'expo-weird',
        moduleRoot: '/m/expo-weird',
      },
    ]);
    expect(text).toContain('error: ');
    expect(text).toContain('expo-weird');
    expect(text).toMatch(/ios|apple/);
  });
});

describe('renderUnmappedDependencyWarning', () => {
  it('warns that a pod dependency has no SwiftPM equivalent and will fail to compile', () => {
    const text = renderUnmappedDependencyWarning([
      {
        packageName: 'expo-image',
        podName: 'ExpoImage',
        pods: ['SDWebImage', 'SDWebImageWebPCoder'],
      },
    ]);
    expect(text).toContain('warning: ');
    expect(text).toContain('expo-image');
    expect(text).toContain('SDWebImage');
    expect(text).toContain('SDWebImageWebPCoder');
  });

  it('returns an empty string when nothing is unmapped', () => {
    expect(renderUnmappedDependencyWarning([])).toBe('');
  });
});

describe('reportUnsupported', () => {
  it('returns null and prints nothing when every module is covered', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(reportUnsupported([])).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('prints the report and returns an error carrying the entries', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const entries = [
      {
        reason: 'mixed-no-manifest',
        podName: 'ExpoAudio',
        packageName: 'expo-audio',
        moduleRoot: '/m',
      },
    ];
    const error = reportUnsupported(entries);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(UnsupportedModulesError);
    expect(error.unsupported).toEqual(entries);
    expect(error.message).toContain('1');
    spy.mockRestore();
  });
});

describe('unresolvable target paths', () => {
  const pending = [
    {
      podName: 'ExpoFoo',
      packageName: 'expo-foo',
      moduleRoot: '/node_modules/expo-foo',
      hasSources: true,
      prebuildProduct: null,
      unresolvedTargets: ['Example'],
    },
  ];

  it('classifies a module whose target sources could not be located', () => {
    expect(classifyUnsupported({ pending, coreAvailable: true })).toEqual([
      {
        reason: 'unresolvable-target-path',
        podName: 'ExpoFoo',
        packageName: 'expo-foo',
        moduleRoot: '/node_modules/expo-foo',
        targetNames: ['Example'],
      },
    ]);
  });

  it('reports what failed, the likely cause and the next step', () => {
    const report = renderUnsupportedReport(classifyUnsupported({ pending, coreAvailable: true }));
    expect(report).toMatch(/^error: Expo module "expo-foo" \(pod ExpoFoo\)/);
    expect(report).toContain('"Example"');
    expect(report).toContain('Sources');
    expect(report).toContain('npx patch-package expo-foo');
    expect(report).toContain('Module path: /node_modules/expo-foo');
  });
});

describe('dependencies on targets the generated package cannot declare', () => {
  const pending = [
    {
      podName: 'ExpoFoo',
      packageName: 'expo-foo',
      moduleRoot: '/node_modules/expo-foo',
      hasSources: true,
      prebuildProduct: null,
      unsupportedTargetDeps: [{ target: 'ExpoFoo', dependsOn: 'FooKit', kind: 'binary' }],
    },
  ];

  it('classifies a module whose manifest depends on a non-regular target', () => {
    expect(classifyUnsupported({ pending, coreAvailable: true })).toEqual([
      {
        reason: 'unsupported-target-dependency',
        podName: 'ExpoFoo',
        packageName: 'expo-foo',
        moduleRoot: '/node_modules/expo-foo',
        dependencies: [{ target: 'ExpoFoo', dependsOn: 'FooKit', kind: 'binary' }],
      },
    ]);
  });

  it('names both targets, the kind, and the prebuild remedy', () => {
    const report = renderUnsupportedReport(classifyUnsupported({ pending, coreAvailable: true }));
    expect(report).toMatch(/^error: Expo module "expo-foo" \(pod ExpoFoo\)/);
    expect(report).toContain('"ExpoFoo"');
    expect(report).toContain('"FooKit"');
    expect(report).toContain('binary target');
    expect(report).toContain('spm.config.json');
    expect(report).toContain('packages/expo-sensors');
    expect(report).toContain('npx patch-package expo-foo');
    expect(report).toContain('Module path: /node_modules/expo-foo');
  });

  it('renders every kind as prose, and explains the rule without enumerating kinds', () => {
    const report = renderUnsupportedReport(
      classifyUnsupported({
        pending: [
          {
            ...pending[0],
            unsupportedTargetDeps: [
              { target: 'ExpoFoo', dependsOn: 'FooSystem', kind: 'systemLibrary' },
              { target: 'ExpoFoo', dependsOn: 'FooMystery' },
            ],
          },
        ],
        coreAvailable: true,
      })
    );
    expect(report).toContain('"FooSystem", a system library target');
    expect(report).not.toContain('systemLibrary');
    expect(report).not.toContain('undefined target');
    expect(report).not.toContain('binary, macro, plugin or system');
  });

  it('lists every dependency it found, not just the first', () => {
    const report = renderUnsupportedReport(
      classifyUnsupported({
        pending: [
          {
            ...pending[0],
            unsupportedTargetDeps: [
              { target: 'ExpoFoo', dependsOn: 'FooKit', kind: 'binary' },
              { target: 'ExpoFooObjC', dependsOn: 'FooMacros', kind: 'macro' },
            ],
          },
        ],
        coreAvailable: true,
      })
    );
    expect(report).toContain('"FooKit"');
    expect(report).toContain('"FooMacros"');
    expect(report).toContain('macro target');
  });
});

describe('a module installed twice', () => {
  let tmp;
  const dir = (...segments) => {
    const created = path.join(tmp, ...segments);
    fs.mkdirSync(created, { recursive: true });
    return created;
  };
  const modules = [{ packageName: 'expo-camera', pods: [{ podName: 'ExpoCamera' }] }];

  beforeAll(() => {
    tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-roots-')));
  });

  afterEach(() => jest.restoreAllMocks());

  it('finds no conflict when both roots are the same directory through a symlink', () => {
    const packageRoot = dir('node_modules', 'expo-camera');
    const link = path.join(dir('links'), 'expo-camera');
    fs.symlinkSync(packageRoot, link, 'dir');

    expect(
      collectRootConflicts(
        resolvePodIdentities(
          modules,
          { ExpoCamera: { packageRoot } },
          new Map([['expo-camera', link]])
        )
      )
    ).toEqual([]);
  });

  it('finds a conflict when the two roots are different directories', () => {
    const packageRoot = dir('node_modules', 'expo-camera');
    const autolinkedRoot = dir('node_modules', 'some-lib', 'node_modules', 'expo-camera');

    expect(
      collectRootConflicts(
        resolvePodIdentities(
          modules,
          { ExpoCamera: { packageRoot } },
          new Map([['expo-camera', autolinkedRoot]])
        )
      )
    ).toEqual([{ packageName: 'expo-camera', moduleRoot: packageRoot, autolinkedRoot }]);
  });

  it('finds no conflict for a documented root that is gone', () => {
    expect(
      collectRootConflicts(
        resolvePodIdentities(
          modules,
          { ExpoCamera: { packageRoot: path.join(tmp, 'vanished') } },
          new Map([['expo-camera', dir('node_modules', 'expo-camera')]])
        )
      )
    ).toEqual([]);
  });

  // A path that cannot be resolved cannot be compared, and a diagnostic is never
  // worth failing a sync over.
  it('reports nothing, and does not throw, when a root cannot be resolved', () => {
    const packageRoot = dir('node_modules', 'expo-camera');
    jest.spyOn(fs, 'realpathSync').mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    expect(
      collectRootConflicts(
        resolvePodIdentities(
          modules,
          { ExpoCamera: { packageRoot } },
          new Map([['expo-camera', path.join(tmp, 'elsewhere')]])
        )
      )
    ).toEqual([]);
  });

  it('names both directories, what uses each, and how to deduplicate', () => {
    const report = renderRootConflictWarning([
      {
        packageName: 'expo-camera',
        moduleRoot: '/app/node_modules/expo-camera',
        autolinkedRoot: '/app/node_modules/some-lib/node_modules/expo-camera',
      },
    ]);
    expect(report).toMatch(/^warning: Expo module "expo-camera"/);
    expect(report).toContain('/app/node_modules/expo-camera');
    expect(report).toContain('/app/node_modules/some-lib/node_modules/expo-camera');
    expect(report).toContain('npm ls expo-camera');
    expect(report).toContain('dedupe');
  });

  // The copies can be different versions, so the mismatch is not confined to runtime.
  it('names both failure modes, without pseudo-code for the import', () => {
    const report = renderRootConflictWarning([
      {
        packageName: 'expo-camera',
        moduleRoot: '/app/node_modules/expo-camera',
        autolinkedRoot: '/app/node_modules/some-lib/node_modules/expo-camera',
      },
    ]);
    expect(report).toContain("your app's JavaScript imports the second");
    expect(report).toContain('usually surfaces at runtime');
    expect(report).toContain('can fail the build');
  });

  it('renders nothing when no module is installed twice', () => {
    expect(renderRootConflictWarning([])).toBe('');
  });
});

describe('extra CocoaPods dependencies', () => {
  const pods = [
    { name: 'MyLocalPod', path: '../vendor/MyLocalPod' },
    { name: 'Firebase', git: 'https://github.com/firebase/firebase-ios-sdk.git' },
    { name: 'AppCenter' },
  ];

  it('names every pod and where it comes from', () => {
    const report = renderExtraPodsWarning(pods);
    expect(report).toContain('MyLocalPod (local path: ../vendor/MyLocalPod)');
    expect(report).toContain('Firebase (git: https://github.com/firebase/firebase-ios-sdk.git)');
    expect(report).toContain('AppCenter (published pod)');
  });

  it('names a custom spec repo as its own origin, and gives the version', () => {
    const report = renderExtraPodsWarning([
      { name: 'InternalSDK', source: 'https://specs.example.com/private.git', version: '2.1.0' },
      { name: 'AppCenter', version: '5.0.0' },
    ]);
    expect(report).toContain(
      'InternalSDK (spec repo: https://specs.example.com/private.git, version 2.1.0)'
    );
    expect(report).toContain('AppCenter (published pod, version 5.0.0)');
  });

  it('names the git ref, the only thing that says which code a git pod means', () => {
    const report = renderExtraPodsWarning([
      { name: 'Firebase', git: 'https://github.com/firebase/firebase-ios-sdk.git', tag: '10.0.0' },
      { name: 'Sentry', git: 'https://github.com/getsentry/sentry-cocoa.git', branch: 'main' },
      { name: 'Lottie', git: 'https://github.com/airbnb/lottie-ios.git', commit: 'a1b2c3d' },
    ]);
    expect(report).toContain(
      'Firebase (git: https://github.com/firebase/firebase-ios-sdk.git, tag 10.0.0)'
    );
    expect(report).toContain(
      'Sentry (git: https://github.com/getsentry/sentry-cocoa.git, branch main)'
    );
    expect(report).toContain(
      'Lottie (git: https://github.com/airbnb/lottie-ios.git, commit a1b2c3d)'
    );
  });

  it('says what declared them, how they fail, and what to do instead', () => {
    const report = renderExtraPodsWarning(pods);
    expect(report).toMatch(/^warning: /);
    expect(report).toContain('extraPods');
    expect(report).toContain('Podfile.properties.json');
    expect(report).toContain('fails to compile or link');
    expect(report).toContain('at runtime');
    expect(report).toContain('keep this app on CocoaPods');
  });

  it('renders nothing when the app declares none', () => {
    expect(renderExtraPodsWarning([])).toBe('');
  });
});

describe('Swift packages the generated package cannot declare', () => {
  const pending = [
    {
      podName: 'ExpoImage',
      packageName: 'expo-image',
      moduleRoot: '/node_modules/expo-image',
      hasSources: true,
      prebuildProduct: null,
      unsupportedPackageDeps: [{ form: 'local-path', identity: 'sdwebimage', target: null }],
    },
  ];

  const report = (unsupportedPackageDeps) =>
    renderUnsupportedReport(
      classifyUnsupported({
        pending: [{ ...pending[0], unsupportedPackageDeps }],
        coreAvailable: true,
      })
    );

  it('classifies a module whose manifest declares a package it cannot mirror', () => {
    expect(classifyUnsupported({ pending, coreAvailable: true })).toEqual([
      {
        reason: 'unsupported-package-dependency',
        podName: 'ExpoImage',
        packageName: 'expo-image',
        moduleRoot: '/node_modules/expo-image',
        dependencies: [{ form: 'local-path', identity: 'sdwebimage', target: null }],
      },
    ]);
  });

  it('names the package, what is wrong with it, and the next step', () => {
    const text = renderUnsupportedReport(classifyUnsupported({ pending, coreAvailable: true }));
    expect(text).toMatch(/^error: Expo module "expo-image" \(pod ExpoImage\)/);
    expect(text).toContain('"sdwebimage"');
    expect(text).toContain('local path');
    expect(text).toContain('npx patch-package expo-image');
    expect(text).toContain('Module path: /node_modules/expo-image');
  });

  it('names the target of a product whose package the manifest never declared', () => {
    const text = report([
      { form: 'undeclared-package', identity: 'libavif-Xcode', target: 'ExpoImage' },
    ]);
    expect(text).toContain('"libavif-Xcode"');
    expect(text).toContain('target "ExpoImage"');
  });

  it('describes a product that names no package without printing a placeholder', () => {
    const text = report([{ form: 'undeclared-package', identity: null, target: 'ExpoImage' }]);
    expect(text).toContain('target "ExpoImage"');
    expect(text).not.toContain('null');
    expect(text).not.toContain('undefined');
  });

  // One remedy cannot serve every cause: a collision is already declared the way a
  // local path should be, and an undeclared package needs a declaration ADDED.
  it('gives each fault its own next step', () => {
    const step = (form) => report([{ form, identity: 'acme', target: 'Main' }]);
    expect(step('local-path')).toContain('remote URL');
    expect(step('undeclared-package')).toContain('Declare that package');
    expect(step('unsupported-requirement')).toContain(
      'an exact version, a branch, a revision or a version range'
    );
    expect(step('module-aliases')).toContain('alias');
    expect(step('unsupported-condition')).toContain('platform');
    expect(step('collides-with-injected')).toContain('React Native');
    expect(step('collides-with-injected')).not.toContain('remote URL');
  });

  it('calls a package a package and a target dependency a dependency', () => {
    expect(
      report([{ form: 'unsupported-condition', identity: 'SDWebImage', target: 'Main' }])
    ).toContain('package "SDWebImage", used by target "Main",');
    const sibling = report([
      { form: 'unsupported-target-condition', identity: 'Helper', target: 'Main' },
    ]);
    expect(sibling).toContain('the dependency on "Helper" in target "Main"');
    expect(sibling).not.toContain('package "Helper"');
  });

  it('names a package claimed twice without calling either one the package', () => {
    const text = report([{ form: 'ambiguous-package-name', identity: 'libavif', target: null }]);
    expect(text).toContain('"libavif" is claimed by two');
    expect(text).toContain('distinct');
  });

  it('lists every dependency it found, not just the first', () => {
    const text = report([
      { form: 'registry', identity: 'acme.widgets', target: null },
      { form: 'unsupported-requirement', identity: 'futured', target: null },
    ]);
    expect(text).toContain('"acme.widgets"');
    expect(text).toContain('"futured"');
  });

  it('renders every form as prose, never as the name the parser uses for it', () => {
    const identities = [
      'alpha',
      'bravo',
      'charlie',
      'delta',
      'echo',
      'foxtrot',
      'golf',
      'hotel',
      'india',
      'juliett',
      'kilo',
      'lima',
    ];
    const text = report([
      { form: 'local-path', identity: 'alpha', target: null },
      { form: 'registry', identity: 'bravo', target: null },
      { form: 'unsupported-location', identity: 'charlie', target: null },
      { form: 'unsupported-requirement', identity: 'delta', target: null },
      { form: 'unknown-form', identity: 'echo', target: null },
      { form: 'undeclared-package', identity: 'foxtrot', target: 'Main' },
      { form: 'collides-with-injected', identity: 'golf', target: null },
      { form: 'module-aliases', identity: 'hotel', target: 'Main' },
      { form: 'unsupported-condition', identity: 'india', target: 'Main' },
      { form: 'unsupported-traits', identity: 'juliett', target: null },
      { form: 'unsupported-target-condition', identity: 'kilo', target: 'Main' },
      { form: 'ambiguous-package-name', identity: 'lima', target: null },
    ]);
    for (const identity of identities) {
      expect(text).toContain(`"${identity}"`);
    }
    for (const form of [
      'local-path',
      'unsupported-location',
      'unsupported-requirement',
      'unknown-form',
      'undeclared-package',
      'collides-with-injected',
      'module-aliases',
      'unsupported-condition',
      'unsupported-traits',
      'unsupported-target-condition',
      'ambiguous-package-name',
    ]) {
      expect(text).not.toContain(form);
    }
    expect(text).not.toContain('undefined');
  });
});

describe('a module with only some pods precompiled', () => {
  const artifactDirs = [
    '/precompiled/expo-dual/output',
    '/repo/packages/precompile/.build/expo-dual/output',
    '/node_modules/expo-dual/prebuilds/output',
  ];
  const pending = (extra) => ({
    podName: 'ExpoDualExtras',
    packageName: 'expo-dual',
    moduleRoot: '/node_modules/expo-dual',
    hasSources: true,
    pureSwift: true,
    prebuildProduct: null,
    precompiledSiblings: ['ExpoDual'],
    precompiledProducts: ['ExpoDual'],
    artifactDirs,
    ...extra,
  });
  const entries = (extra) =>
    classifyUnsupported({ pending: [pending(extra)], coreAvailable: true });

  it('classifies the pod that is not precompiled, naming the siblings that are', () => {
    expect(entries()).toEqual([
      {
        reason: 'partially-precompiled',
        podName: 'ExpoDualExtras',
        packageName: 'expo-dual',
        moduleRoot: '/node_modules/expo-dual',
        precompiledSiblings: ['ExpoDual'],
        precompiledProducts: ['ExpoDual'],
        artifactDirs,
        prebuildProduct: null,
      },
    ]);
  });

  it('reports it before the prebuild route, which would not explain the double link', () => {
    expect(
      entries({ prebuildProduct: { name: 'ExpoDualExtras', sourceOnly: false } })[0].reason
    ).toBe('partially-precompiled');
  });

  it('names both pods, the double link, and the all-or-none remedies', () => {
    const report = renderUnsupportedReport(entries());
    expect(report).toMatch(/^error: Expo module "expo-dual" \(pod ExpoDualExtras\)/);
    expect(report).toContain('ExpoDual ');
    expect(report).toContain('twice');
    expect(report).toContain('et prebuild expo-dual');
    expect(report).toContain('spm.config.json');
    expect(report).toContain('"exclude": ["expo-dual"]');
    expect(report).toContain('Module path: /node_modules/expo-dual');
  });

  it('lists every precompiled sibling', () => {
    const report = renderUnsupportedReport(
      entries({ precompiledSiblings: ['ExpoDual', 'ExpoDualKit'] })
    );
    expect(report).toContain('ExpoDual, ExpoDualKit');
  });

  it('names every directory the artifact resolver searches, in its order, and both artifact forms', () => {
    const report = renderUnsupportedReport(entries());
    const positions = artifactDirs.map((dir) => report.indexOf(dir));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(report).toContain('ExpoDual.xcframework');
    expect(report).toContain('ExpoDual.tar.gz');
    expect(report).toContain('debug/xcframeworks');
    expect(report).toContain('release/xcframeworks');
    expect(report).toContain("add a product for ExpoDualExtras to expo-dual's spm.config.json");
  });

  it('names the artifacts after the product a sibling ships, not after its pod', () => {
    const report = renderUnsupportedReport(
      entries({ precompiledSiblings: ['RNSkiaPod'], precompiledProducts: ['RNSkia'] })
    );
    expect(report).toContain('— RNSkia.xcframework or RNSkia.tar.gz, under');
    expect(report).not.toContain('RNSkiaPod.xcframework');
    expect(report).toContain('its sibling pod RNSkiaPod does');
  });

  it('says so when spm.config.json already declares the pod it asks to build', () => {
    const report = renderUnsupportedReport(
      entries({ prebuildProduct: { name: 'ExpoDualExtras', sourceOnly: false } })
    );
    expect(report).toContain('already declares "ExpoDualExtras"');
    expect(report).toContain('et prebuild expo-dual');
  });

  it('does not promise an XCFramework for a source-only product', () => {
    const report = renderUnsupportedReport(
      entries({ prebuildProduct: { name: 'ExpoDualExtras', sourceOnly: true } })
    );
    expect(report).toContain('sourceOnly');
    expect(report).not.toContain('et prebuild');
    expect(report).toMatch(/^ {2}1\. To build it from source instead/m);
  });
});
