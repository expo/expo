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
  spmConfigProduct,
} = require('../diagnostics');

function withModuleDir(files, run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-diag-'));
  try {
    for (const [name, contents] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, name), contents);
    }
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

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

describe('spmConfigProduct', () => {
  const config = JSON.stringify({
    products: [
      { name: 'ExpoModulesCore', podName: 'ExpoModulesCore' },
      { name: 'ExpoModulesWorklets', podName: 'ExpoModulesWorklets' },
      {
        name: 'ExpoModulesWorkletsAdapter',
        podName: 'ExpoModulesWorkletsAdapter',
        sourceOnly: true,
      },
    ],
  });

  it('finds the product declaring a pod', () => {
    withModuleDir({ 'spm.config.json': config }, (dir) => {
      expect(spmConfigProduct(dir, 'ExpoModulesWorklets')).toEqual({
        name: 'ExpoModulesWorklets',
        sourceOnly: false,
      });
    });
  });

  it('reports a source-only product as such', () => {
    withModuleDir({ 'spm.config.json': config }, (dir) => {
      expect(spmConfigProduct(dir, 'ExpoModulesWorkletsAdapter')).toEqual({
        name: 'ExpoModulesWorkletsAdapter',
        sourceOnly: true,
      });
    });
  });

  it('falls back to the product name when podName is absent', () => {
    withModuleDir(
      { 'spm.config.json': JSON.stringify({ products: [{ name: 'ExpoFoo' }] }) },
      (dir) => {
        expect(spmConfigProduct(dir, 'ExpoFoo')).toEqual({ name: 'ExpoFoo', sourceOnly: false });
      }
    );
  });

  it('returns null for an undeclared pod, a missing file, and malformed JSON', () => {
    withModuleDir({ 'spm.config.json': config }, (dir) => {
      expect(spmConfigProduct(dir, 'ExpoAudio')).toBeNull();
    });
    withModuleDir({}, (dir) => expect(spmConfigProduct(dir, 'ExpoAudio')).toBeNull());
    withModuleDir({ 'spm.config.json': '{ not json' }, (dir) =>
      expect(spmConfigProduct(dir, 'ExpoAudio')).toBeNull()
    );
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
