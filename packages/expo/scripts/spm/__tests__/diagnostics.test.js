'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  UnsupportedModulesError,
  UNMAPPED_POD_ALLOWLIST,
  classifyUnsupported,
  unmappedPodDependencies,
  renderUnsupportedReport,
  reportUnsupported,
  renderUnmappedDependencyWarning,
  collectDuplicatePods,
  collectRootConflicts,
  renderRootConflictWarning,
  renderExtraPodsWarning,
} = require('../diagnostics');
const { resolvePodIdentities, uncoveredPod } = require('../plugin');
const { podspecDependencies } = require('../podspec');

/** An uncovered pod, from the facts the plugin gathers and the refusal pass 2 recorded. */
const pendingPod = ({ hasSources = true, prebuildProduct = null, refusal = null, ...subject }) =>
  uncoveredPod({ ...subject, prebuildProduct, sources: { hasSources } }, refusal);

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
        pendingPod({
          podName: 'ExpoAudio',
          packageName: 'expo-audio',
          moduleRoot: '/m/expo-audio',
          hasSources: true,
        }),
      ],
      coreAvailable: true,
    });
    expect(entry).toMatchObject({ reason: 'mixed-no-manifest', podName: 'ExpoAudio' });
  });

  it('prefers the prebuild route when the module declares a prebuildable product', () => {
    const [entry] = classifyUnsupported({
      pending: [
        pendingPod({
          podName: 'ExpoAudio',
          packageName: 'expo-audio',
          moduleRoot: '/m/expo-audio',
          hasSources: true,
          prebuildProduct: { name: 'ExpoAudio', sourceOnly: false },
        }),
      ],
      coreAvailable: true,
    });
    expect(entry).toMatchObject({ reason: 'prebuild-available', podName: 'ExpoAudio' });
  });

  it('does not offer the prebuild route for a source-only product', () => {
    const [entry] = classifyUnsupported({
      pending: [
        pendingPod({
          podName: 'ExpoModulesWorkletsAdapter',
          packageName: 'expo-modules-core',
          moduleRoot: '/m/expo-modules-core',
          hasSources: true,
          prebuildProduct: { name: 'ExpoModulesWorkletsAdapter', sourceOnly: true },
        }),
      ],
      coreAvailable: true,
    });
    expect(entry).toMatchObject({ reason: 'mixed-no-manifest' });
  });

  it('classifies a module whose apple sources could not be located', () => {
    const [entry] = classifyUnsupported({
      pending: [
        pendingPod({
          podName: 'ExpoWeird',
          packageName: 'expo-weird',
          moduleRoot: '/m/expo-weird',
          hasSources: false,
        }),
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
          pendingPod({
            podName: 'ExpoBad',
            packageName: 'expo-bad',
            moduleRoot: '/m/expo-bad',
            hasSources: true,
            prebuildProduct: { name: 'ExpoBad', sourceOnly: false },
            refusal: {
              reason: 'needs-manifest-for-linkage',
              file: '/m/expo-bad/ios/ExpoBad.podspec',
              line: 19,
              snippet: "s.frameworks = 'Photos'",
            },
          }),
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
  const subject = { podName: 'ExpoBad', packageName: 'expo-bad', moduleRoot: '/m/expo-bad' };
  const reasonFor = (pod) => classifyUnsupported({ pending: [pod], coreAvailable: true })[0].reason;
  const podspecLinkage = {
    reason: 'needs-manifest-for-linkage',
    file: '/m/expo-bad/ios/ExpoBad.podspec',
    line: 19,
    snippet: "s.frameworks = 'Photos'",
  };
  const unresolvedTargets = { reason: 'unresolvable-target-path', targetNames: ['Main'] };

  it('reports the linkage before targets whose sources it could not find', () => {
    expect(reasonFor({ ...subject, refusals: [unresolvedTargets, podspecLinkage] })).toBe(
      'needs-manifest-for-linkage'
    );
  });

  it('asks for the prebuild before reporting targets it could not resolve', () => {
    expect(
      reasonFor(
        pendingPod({
          ...subject,
          refusal: unresolvedTargets,
          prebuildProduct: { name: 'ExpoBad', sourceOnly: false },
        })
      )
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
        pendingPod({
          podName: 'ExpoBad',
          packageName: 'expo-bad',
          moduleRoot: '/m/expo-bad',
          refusal: { reason: 'needs-manifest-for-linkage', ...podspecLinkage },
        }),
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
    pendingPod({
      podName: 'ExpoFoo',
      packageName: 'expo-foo',
      moduleRoot: '/node_modules/expo-foo',
      hasSources: true,
      prebuildProduct: null,
      refusal: { reason: 'unresolvable-target-path', targetNames: ['Example'] },
    }),
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
  const podDependingOn = (dependencies) =>
    pendingPod({
      podName: 'ExpoFoo',
      packageName: 'expo-foo',
      moduleRoot: '/node_modules/expo-foo',
      hasSources: true,
      prebuildProduct: null,
      refusal: { reason: 'unsupported-target-dependency', dependencies },
    });
  const pending = [podDependingOn([{ target: 'ExpoFoo', dependsOn: 'FooKit', kind: 'binary' }])];

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
          podDependingOn([
            { target: 'ExpoFoo', dependsOn: 'FooSystem', kind: 'systemLibrary' },
            { target: 'ExpoFoo', dependsOn: 'FooMystery' },
          ]),
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
          podDependingOn([
            { target: 'ExpoFoo', dependsOn: 'FooKit', kind: 'binary' },
            { target: 'ExpoFooObjC', dependsOn: 'FooMacros', kind: 'macro' },
          ]),
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
  const conflicts = (documented, autolinked) =>
    collectRootConflicts(
      resolvePodIdentities(
        [{ packageName: 'expo-camera', pods: [{ podName: 'ExpoCamera' }] }],
        new Map([['ExpoCamera', { packageRoot: documented }]]),
        new Map([['expo-camera', autolinked]])
      )
    );

  beforeAll(() => {
    tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-roots-')));
  });

  afterEach(() => jest.restoreAllMocks());

  it('finds no conflict when both roots are the same directory through a symlink', () => {
    const packageRoot = dir('node_modules', 'expo-camera');
    const link = path.join(dir('links'), 'expo-camera');
    fs.symlinkSync(packageRoot, link, 'dir');

    expect(conflicts(packageRoot, link)).toEqual([]);
  });

  it('finds a conflict when the two roots are different directories', () => {
    const packageRoot = dir('node_modules', 'expo-camera');
    const autolinkedRoot = dir('node_modules', 'some-lib', 'node_modules', 'expo-camera');

    expect(conflicts(packageRoot, autolinkedRoot)).toEqual([
      { packageName: 'expo-camera', moduleRoot: packageRoot, autolinkedRoot },
    ]);
  });

  it('finds no conflict for a documented root that is gone', () => {
    expect(conflicts(path.join(tmp, 'vanished'), dir('node_modules', 'expo-camera'))).toEqual([]);
  });

  // A path that cannot be resolved cannot be compared, and a diagnostic is never
  // worth failing a sync over.
  it('reports nothing, and does not throw, when a root cannot be resolved', () => {
    const packageRoot = dir('node_modules', 'expo-camera');
    jest.spyOn(fs, 'realpathSync').mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    expect(conflicts(packageRoot, path.join(tmp, 'elsewhere'))).toEqual([]);
  });

  // The copies can be different versions, so the mismatch is not confined to runtime.
  it('names both directories, what uses each, both failure modes, and how to deduplicate', () => {
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
    expect(report).toContain("your app's JavaScript imports the second");
    expect(report).toContain('usually surfaces at runtime');
    expect(report).toContain('can fail the build');
  });

  it('renders nothing when no module is installed twice', () => {
    expect(renderRootConflictWarning([])).toBe('');
  });
});

describe('separate copies of one pod name', () => {
  let tmp;
  beforeAll(() => {
    tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-copies-')));
  });
  const dir = (name) => {
    const created = path.join(tmp, name);
    fs.mkdirSync(created, { recursive: true });
    return created;
  };
  const duplicatesIn = (...listings) =>
    collectDuplicatePods(
      new Map(
        listings.map(([packageName, declaringRoot], index) => [
          index,
          { podName: 'ExpoX', packageName, declaringRoot },
        ])
      )
    );

  // P at r1 and P at r2 are one package; Q at r2 is the directory P at r2 is in.
  // Joined either way, all three are one copy.
  it('is one copy for listings joined through a shared package or directory, in any order', () => {
    const a = ['expo-p', dir('r1')];
    const b = ['expo-q', dir('r2')];
    const c = ['expo-p', dir('r2')];

    for (const order of [
      [a, b, c],
      [a, c, b],
      [b, a, c],
      [b, c, a],
      [c, a, b],
      [c, b, a],
    ]) {
      expect(duplicatesIn(...order)).toEqual([]);
    }
  });

  it('shows each copy by its lowest root, in any order', () => {
    const a = ['expo-p', dir('r1')];
    const c = ['expo-p', dir('r2')];
    const d = ['expo-z', dir('r3')];
    const copies = [
      { packageName: 'expo-p', moduleRoot: a[1] },
      { packageName: 'expo-z', moduleRoot: d[1] },
    ];

    for (const order of [
      [a, c, d],
      [a, d, c],
      [c, a, d],
      [c, d, a],
      [d, a, c],
      [d, c, a],
    ]) {
      expect(duplicatesIn(...order)).toEqual([
        { reason: 'duplicate-pod-name', podName: 'ExpoX', copies },
      ]);
    }
  });

  it('is one copy for one directory reached through a symlink', () => {
    const link = path.join(tmp, 'alias');
    fs.symlinkSync(dir('shared'), link, 'dir');

    expect(duplicatesIn(['expo-a', dir('shared')], ['expo-b', link])).toEqual([]);
  });

  it('keeps two roots that cannot be resolved apart, in any order', () => {
    const a = ['expo-a', path.join(tmp, 'missing-a')];
    const b = ['expo-b', path.join(tmp, 'missing-b')];
    const duplicate = [
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          { packageName: a[0], moduleRoot: a[1] },
          { packageName: b[0], moduleRoot: b[1] },
        ],
      },
    ];

    expect(duplicatesIn(a, b)).toEqual(duplicate);
    expect(duplicatesIn(b, a)).toEqual(duplicate);
  });

  it('is one copy for one unresolvable root two packages name identically', () => {
    const missing = path.join(tmp, 'missing');

    expect(duplicatesIn(['expo-a', missing], ['expo-b', missing])).toEqual([]);
  });

  it('names every copy, why the sync fails, and how to keep one', () => {
    const report = renderUnsupportedReport([
      {
        reason: 'duplicate-pod-name',
        podName: 'ExpoX',
        copies: [
          { packageName: 'expo-x', moduleRoot: '/app/node_modules/expo-x' },
          { packageName: 'expo-x-fork', moduleRoot: '/app/node_modules/expo-x-fork' },
          { packageName: 'expo-x-next', moduleRoot: '/app/node_modules/expo-x-next' },
        ],
      },
    ]);

    expect(report).toMatch(/^error: The pod ExpoX is declared by 3 different packages/);
    expect(report).toContain('\n      "expo-x" at /app/node_modules/expo-x\n');
    expect(report).toContain('\n      "expo-x-fork" at /app/node_modules/expo-x-fork\n');
    expect(report).toContain('links a pod name only once');
    expect(report).toContain('"exclude": ["expo-x-fork", "expo-x-next"]');
  });
});

describe('extra CocoaPods dependencies', () => {
  const FIREBASE_GIT = 'https://github.com/firebase/firebase-ios-sdk.git';
  const origins = [
    [
      'MyLocalPod (local path: ../vendor/MyLocalPod)',
      { name: 'MyLocalPod', path: '../vendor/MyLocalPod' },
    ],
    [`Firebase (git: ${FIREBASE_GIT})`, { name: 'Firebase', git: FIREBASE_GIT }],
    ['AppCenter (published pod)', { name: 'AppCenter' }],
    [
      'InternalSDK (spec repo: https://specs.example.com/private.git, version 2.1.0)',
      { name: 'InternalSDK', source: 'https://specs.example.com/private.git', version: '2.1.0' },
    ],
    ['AppCenter (published pod, version 5.0.0)', { name: 'AppCenter', version: '5.0.0' }],
    // A git pod's ref is the only thing that says which code it means.
    [
      `Firebase (git: ${FIREBASE_GIT}, tag 10.0.0)`,
      { name: 'Firebase', git: FIREBASE_GIT, tag: '10.0.0' },
    ],
    [
      'Sentry (git: https://github.com/getsentry/sentry-cocoa.git, branch main)',
      { name: 'Sentry', git: 'https://github.com/getsentry/sentry-cocoa.git', branch: 'main' },
    ],
    [
      'Lottie (git: https://github.com/airbnb/lottie-ios.git, commit a1b2c3d)',
      { name: 'Lottie', git: 'https://github.com/airbnb/lottie-ios.git', commit: 'a1b2c3d' },
    ],
  ];
  const report = renderExtraPodsWarning(origins.map(([, pod]) => pod));

  it.each(origins)('lists %s', (line) => {
    expect(report).toContain(line);
  });

  it('says what declared them, how they fail, and what to do instead', () => {
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
  const podDeclaring = (dependencies) =>
    pendingPod({
      podName: 'ExpoImage',
      packageName: 'expo-image',
      moduleRoot: '/node_modules/expo-image',
      hasSources: true,
      prebuildProduct: null,
      refusal: { reason: 'unsupported-package-dependency', dependencies },
    });
  const pending = [podDeclaring([{ form: 'local-path', identity: 'sdwebimage', target: null }])];

  const report = (unsupportedPackageDeps) =>
    renderUnsupportedReport(
      classifyUnsupported({
        pending: [podDeclaring(unsupportedPackageDeps)],
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
    const dependencies = [
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
    ];
    const text = report(dependencies);
    for (const { form, identity } of dependencies) {
      expect(text).toContain(`"${identity}"`);
      // "registry" is also the plain English word the prose uses.
      if (form !== 'registry') expect(text).not.toContain(form);
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
  const pending = ({
    prebuildProduct = null,
    precompiledSiblings = ['ExpoDual'],
    precompiledProducts = ['ExpoDual'],
  } = {}) =>
    pendingPod({
      podName: 'ExpoDualExtras',
      packageName: 'expo-dual',
      moduleRoot: '/node_modules/expo-dual',
      hasSources: true,
      prebuildProduct,
      refusal: {
        reason: 'partially-precompiled',
        precompiledSiblings,
        precompiledProducts,
        artifactDirs,
        prebuildProduct,
      },
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
