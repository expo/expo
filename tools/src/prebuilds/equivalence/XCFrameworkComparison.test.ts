import fs from 'fs-extra';
import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import path from 'path';

import { parseNmOutput } from './SymbolTable';
import {
  compareXCFrameworks,
  formatEquivalenceReport,
  normalizeArtifactText,
  type CompareOptions,
} from './XCFrameworkComparison';

const PRODUCT = 'ExpoFont';
const BUNDLE = 'expo-font_ExpoFont.bundle';
const SIMULATOR = 'ios-arm64_x86_64-simulator';

/** Both sides' staging directories, so the fixtures exercise anchored path collapsing. */
const REPO_ROOT = '/Users/ci/repo';
const BUILD_ROOT = '/private/tmp/mode-b-build';

const NM_TEXT = [
  '000000000000aedc T _$s8ExpoFont010unregisterB03urlSbSo8CFURLRefa_tKF',
  '0000000000018768 D _$s8ExpoFont013UnregisteringB15FailedExceptionCMm',
  '00000000000114a0 S _OBJC_CLASS_$_EXFontLoader',
  '0000000000005b0c T _EXFontCreateWithName',
  '',
].join('\n');

const MODULE_FLAGS =
  '// swift-module-flags: -target arm64-apple-ios16.4 -enable-objc-interop ' +
  '-enable-library-evolution -swift-version 5 ' +
  `-I ${REPO_ROOT}/packages/precompile/.build/expo-font/generated/ExpoFont/include ` +
  '-module-name ExpoFont';

const INTERFACE = [
  '// swift-interface-format-version: 1.0',
  '// swift-compiler-version: Apple Swift version 6.3.3 (swiftlang-6.3.3.1.3)',
  MODULE_FLAGS,
  'import Foundation',
  '@_exported import Swift',
  'public class FontLoader {',
  '  public static let endpoint: Swift.String = "https://api.example.com/v1"',
  '  @available(*, unavailable)',
  '  public func load(name: Swift.String) -> Swift.Bool',
  '  public func unload(name: Swift.String)',
  '}',
  '',
].join('\n');

/** Real shape (verified against EXApplication.xcframework): `use React`, umbrella, export. */
const MODULEMAP = [
  `framework module ${PRODUCT} {`,
  '    use React',
  `    umbrella header "${PRODUCT}_umbrella.h"`,
  `    header "${PRODUCT}-Swift.h"`,
  '',
  '    export *',
  '    module * { export * }',
  '}',
  '',
].join('\n');

const PRIVACY_INFO = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<plist version="1.0"><dict>',
  '  <key>NSPrivacyCollectedDataTypes</key><array/>',
  '</dict></plist>',
  '',
].join('\n');

/**
 * A fixture binary holds recorded `nm -gU` text. A fat one holds one `### <arch>` section per
 * architecture, standing in for `lipo -archs` plus one `nm -arch` run each; a thin one is bare nm
 * text and reads as arm64. Perturbing symbols is therefore an edit to the fixture binary, and the
 * comparator runs its production path unchanged.
 */
function readRecordedSymbols(binaryPath: string): Map<string, Set<string>> {
  const text = fs.readFileSync(binaryPath, 'utf8');
  if (!text.startsWith('### ')) {
    return new Map([['arm64', parseNmOutput(text, { source: binaryPath })]]);
  }
  return new Map(
    text
      .split(/^### /m)
      .filter(Boolean)
      .map((section) => {
        const [arch, ...lines] = section.split('\n');
        return [
          arch.trim(),
          parseNmOutput(lines.join('\n'), { source: `${binaryPath} (${arch.trim()})` }),
        ];
      })
  );
}

function fatBinary(architectures: Record<string, string>): string {
  return Object.entries(architectures)
    .map(([arch, nmText]) => `### ${arch}\n${nmText}`)
    .join('');
}

const options: CompareOptions = {
  readSymbols: readRecordedSymbols,
  pathRoots: [REPO_ROOT, BUILD_ROOT],
};

/** Mirrors a real slice: dSYMs, a bundle beside the framework and one inside it. */
function makeXCFramework(slices: string[] = ['ios-arm64', SIMULATOR]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xcframework-comparison-'));
  fs.outputFileSync(path.join(root, 'Info.plist'), '<plist/>');
  for (const slice of slices) {
    const sliceDir = path.join(root, slice);
    const framework = path.join(sliceDir, `${PRODUCT}.framework`);
    const swiftModule = path.join(framework, 'Modules', `${PRODUCT}.swiftmodule`);

    fs.outputFileSync(path.join(framework, PRODUCT), NM_TEXT);
    fs.outputFileSync(path.join(framework, 'Info.plist'), '<plist/>');
    fs.outputFileSync(path.join(framework, 'Headers', `${PRODUCT}-Swift.h`), '// generated');
    fs.outputFileSync(path.join(framework, 'Headers', `${PRODUCT}_umbrella.h`), '// umbrella');
    fs.outputFileSync(
      path.join(framework, 'Headers', 'EXFontLoader.h'),
      '@interface EXFontLoader : NSObject\n- (void)load;\n@end\n'
    );
    fs.outputFileSync(path.join(framework, 'Modules', 'module.modulemap'), MODULEMAP);
    fs.outputFileSync(path.join(swiftModule, 'arm64-apple-ios.swiftinterface'), INTERFACE);
    fs.outputFileSync(path.join(swiftModule, 'arm64-apple-ios.private.swiftinterface'), INTERFACE);
    fs.outputFileSync(path.join(swiftModule, 'arm64-apple-ios.package.swiftinterface'), INTERFACE);
    fs.outputFileSync(path.join(swiftModule, 'arm64-apple-ios.swiftdoc'), 'binary-ish');
    fs.outputFileSync(path.join(swiftModule, 'arm64-apple-ios.abi.json'), '{}');

    for (const bundle of [path.join(sliceDir, BUNDLE), path.join(framework, BUNDLE)]) {
      fs.outputFileSync(path.join(bundle, 'Info.plist'), '<plist/>');
      fs.outputFileSync(path.join(bundle, 'PrivacyInfo.xcprivacy'), PRIVACY_INFO);
    }

    const dSYM = path.join(sliceDir, 'dSYMs', `${PRODUCT}.framework.dSYM`, 'Contents');
    fs.outputFileSync(path.join(dSYM, 'Info.plist'), '<plist/>');
    fs.outputFileSync(path.join(dSYM, 'Resources', 'DWARF', PRODUCT), 'dwarf');
  }
  return root;
}

function clone(root: string): string {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'xcframework-comparison-copy-'));
  fs.copySync(root, copy);
  return copy;
}

function slicePath(root: string, ...parts: string[]): string {
  return path.join(root, 'ios-arm64', `${PRODUCT}.framework`, ...parts);
}

function interfacePath(root: string, name = 'arm64-apple-ios.swiftinterface'): string {
  return slicePath(root, 'Modules', `${PRODUCT}.swiftmodule`, name);
}

function rewrite(file: string, edit: (contents: string) => string): void {
  fs.writeFileSync(file, edit(fs.readFileSync(file, 'utf8')));
}

/** Rewrites every `.swiftinterface` of every slice, the way a real build would. */
function rewriteAllInterfaces(root: string, edit: (contents: string) => string): void {
  for (const slice of fs.readdirSync(root)) {
    const swiftModule = path.join(
      root,
      slice,
      `${PRODUCT}.framework`,
      'Modules',
      `${PRODUCT}.swiftmodule`
    );
    if (!fs.existsSync(swiftModule)) {
      continue;
    }
    for (const file of fs.readdirSync(swiftModule)) {
      if (file.endsWith('.swiftinterface')) {
        rewrite(path.join(swiftModule, file), edit);
      }
    }
  }
}

describe('compareXCFrameworks — positive control (B1)', () => {
  it('reports an identical copy as equivalent with no differences', () => {
    const a = makeXCFramework();
    const b = clone(a);

    const report = compareXCFrameworks(a, b, options);

    assert.deepEqual(report.differences, []);
    assert.equal(report.equivalent, true);
    assert.match(formatEquivalenceReport(report), /equivalent/i);
  });

  it('ignores dSYMs, which differ between any two builds', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(path.join(b, 'ios-arm64', 'dSYMs'));
    fs.writeFileSync(
      path.join(b, SIMULATOR, 'dSYMs', `${PRODUCT}.framework.dSYM`, 'Contents', 'Info.plist'),
      '<plist>different</plist>'
    );

    assert.deepEqual(compareXCFrameworks(a, b, options).differences, []);
  });
});

describe('compareXCFrameworks — negative controls (B2)', () => {
  it('detects a symbol removed from one side and names it', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(slicePath(b, PRODUCT), (text) =>
      text
        .split('\n')
        .filter((line) => !line.includes('_EXFontCreateWithName'))
        .join('\n')
    );

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.kind === 'symbols');
    assert.ok(difference, 'expected a symbols difference');
    assert.deepEqual(difference.onlyInA, ['_EXFontCreateWithName']);
    assert.deepEqual(difference.onlyInB, []);
    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /_EXFontCreateWithName/);
  });

  it('detects a symbol added to one side and names it', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(slicePath(b, PRODUCT), (text) => `${text}0000000000006000 T _EXFontBrandNew\n`);

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.kind === 'symbols');
    assert.ok(difference, 'expected a symbols difference');
    assert.deepEqual(difference.onlyInB, ['_EXFontBrandNew']);
    assert.match(formatEquivalenceReport(report), /_EXFontBrandNew/);
  });

  it('detects a public declaration removed from a .swiftinterface and names the line', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(interfacePath(b), (text) =>
      text.replace('  public func unload(name: Swift.String)\n', '')
    );

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.kind === 'interface');
    assert.ok(difference, 'expected an interface difference');
    assert.deepEqual(difference.onlyInA, ['public func unload(name: Swift.String)']);
    assert.match(formatEquivalenceReport(report), /public func unload/);
    assert.match(formatEquivalenceReport(report), /arm64-apple-ios\.swiftinterface/);
  });

  it('detects -enable-library-evolution dropped from swift-module-flags', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(interfacePath(b), (text) => text.replace(' -enable-library-evolution', ''));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.kind === 'interface');
    assert.ok(difference, 'expected an interface difference');
    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /-enable-library-evolution/);
  });

  it('detects a whole slice missing on one side and names the slice', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(path.join(b, SIMULATOR));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.slice === SIMULATOR);
    assert.ok(difference, 'expected a slice difference');
    assert.equal(difference.kind, 'structure');
    assert.match(formatEquivalenceReport(report), new RegExp(SIMULATOR));
  });

  it('detects a whole slice missing from the FIRST side too (S1)', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(path.join(a, SIMULATOR));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.slice === SIMULATOR);
    assert.ok(difference, 'expected a slice difference');
    assert.deepEqual(difference.onlyInB, [SIMULATOR]);
    assert.deepEqual(difference.onlyInA, []);
  });

  it('detects a header missing from Headers/ and names the file', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(slicePath(b, 'Headers', 'EXFontLoader.h'));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find(
      (d) =>
        d.kind === 'structure' && d.onlyInA.includes(`${PRODUCT}.framework/Headers/EXFontLoader.h`)
    );
    assert.ok(difference, 'expected a header difference');
    assert.match(formatEquivalenceReport(report), /EXFontLoader\.h/);
  });

  it('detects a header missing from the FIRST side too (S1)', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(slicePath(a, 'Headers', 'EXFontLoader.h'));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) =>
      d.onlyInB.includes(`${PRODUCT}.framework/Headers/EXFontLoader.h`)
    );
    assert.ok(difference, 'expected a header difference');
    assert.deepEqual(difference.onlyInA, []);
  });

  it('detects a missing module.modulemap', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(slicePath(b, 'Modules', 'module.modulemap'));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find(
      (d) => d.kind === 'structure' && d.onlyInA.some((item) => item.endsWith('module.modulemap'))
    );
    assert.ok(difference, 'expected a modulemap difference');
    assert.match(formatEquivalenceReport(report), /module\.modulemap/);
  });

  it('detects a .private.swiftinterface present on one side only', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(interfacePath(b, 'arm64-apple-ios.private.swiftinterface'));

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /arm64-apple-ios\.private\.swiftinterface/);
  });
});

describe('compareXCFrameworks — .package.swiftinterface (round 6b item 9)', () => {
  const packageInterface = (root: string) =>
    interfacePath(root, 'arm64-apple-ios.package.swiftinterface');

  it('passes over one present on one side only: package API is not consumer API', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(packageInterface(b));

    const report = compareXCFrameworks(a, b, options);

    assert.deepEqual(report.differences, []);
    assert.equal(report.equivalent, true);
  });

  it('still compares the contents of one both sides carry', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(packageInterface(b), (text) =>
      text.replace('public func unload(name: Swift.String)', 'public func unload()')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /arm64-apple-ios\.package\.swiftinterface/);
    assert.match(formatEquivalenceReport(report), /public func unload\(\)/);
  });
});

describe('compareXCFrameworks — the whole slice tree, not only *.framework (B1 of review)', () => {
  it('detects a resource bundle removed from beside the framework', () => {
    const a = makeXCFramework();
    const b = clone(a);
    for (const slice of ['ios-arm64', SIMULATOR]) {
      fs.removeSync(path.join(b, slice, BUNDLE));
    }

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), new RegExp(BUNDLE.replace('.', '\\.')));
  });

  it('detects a resource bundle removed from inside the framework', () => {
    const a = makeXCFramework();
    const b = clone(a);
    for (const slice of ['ios-arm64', SIMULATOR]) {
      fs.removeSync(path.join(b, slice, `${PRODUCT}.framework`, BUNDLE));
    }

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(
      formatEquivalenceReport(report),
      new RegExp(`${PRODUCT}\\.framework/${BUNDLE}`.replace('.b', '\\.b'))
    );
  });

  it('detects PrivacyInfo.xcprivacy missing from a bundle', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.removeSync(path.join(b, 'ios-arm64', BUNDLE, 'PrivacyInfo.xcprivacy'));

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /PrivacyInfo\.xcprivacy/);
  });

  it('detects changed PrivacyInfo.xcprivacy content', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(path.join(b, 'ios-arm64', BUNDLE, 'PrivacyInfo.xcprivacy'), (text) =>
      text.replace('<array/>', '<array><string>NSPrivacyCollectedDataTypeDeviceID</string></array>')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /PrivacyInfo\.xcprivacy/);
    assert.match(formatEquivalenceReport(report), /NSPrivacyCollectedDataTypeDeviceID/);
  });
});

describe('compareXCFrameworks — text content, not only file names (B2 of review)', () => {
  it('detects a gutted module.modulemap', () => {
    const a = makeXCFramework();
    const b = clone(a);
    for (const slice of ['ios-arm64', SIMULATOR]) {
      fs.writeFileSync(
        path.join(b, slice, `${PRODUCT}.framework`, 'Modules', 'module.modulemap'),
        '// gutted\n'
      );
    }

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /module\.modulemap/);
    assert.match(formatEquivalenceReport(report), /umbrella header/);
  });

  it('detects a gutted public header', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.writeFileSync(slicePath(b, 'Headers', 'EXFontLoader.h'), '// gutted\n');

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /EXFontLoader\.h/);
    assert.match(formatEquivalenceReport(report), /@interface EXFontLoader/);
  });

  it('detects a changed ObjC method signature, the only signal a pure-ObjC package gives', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(slicePath(b, 'Headers', 'EXFontLoader.h'), (text) =>
      text.replace('- (void)load;', '- (void)load:(NSString *)name;')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /- \(void\)load:\(NSString \*\)name;/);
  });
});

describe('compareXCFrameworks — interface order (B3 of review)', () => {
  it('detects an attribute moved from one declaration to the next', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewriteAllInterfaces(b, (text) =>
      text.replace(
        '  @available(*, unavailable)\n  public func load(name: Swift.String) -> Swift.Bool\n',
        '  public func load(name: Swift.String) -> Swift.Bool\n  @available(*, unavailable)\n'
      )
    );

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /@available/);
  });
});

describe('compareXCFrameworks — anchored path normalization (B4 of review)', () => {
  it('collapses staging paths under a known root', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewriteAllInterfaces(b, (text) =>
      text.replace(
        `${REPO_ROOT}/packages/precompile/.build/expo-font/generated/ExpoFont/include`,
        `${BUILD_ROOT}/expo-font/staging/ios`
      )
    );

    assert.deepEqual(compareXCFrameworks(a, b, options).differences, []);
  });

  it('keeps a URL in a public default value', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewriteAllInterfaces(b, (text) =>
      text.replace('https://api.example.com/v1', 'https://api.example.com/v2')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /api\.example\.com\/v2/);
  });

  it('keeps an arithmetic macro value', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewriteAllInterfaces(a, (text) =>
      text.replace('-swift-version 5', '-swift-version 5 -Xcc -DFACTOR=8/2/1')
    );
    rewriteAllInterfaces(b, (text) =>
      text.replace('-swift-version 5', '-swift-version 5 -Xcc -DFACTOR=8/4/1')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /-DFACTOR=8\/4\/1/);
  });

  it('keeps a non-path flag change', () => {
    const a = makeXCFramework();
    const b = clone(a);
    rewrite(interfacePath(b), (text) => text.replace('-swift-version 5', '-swift-version 6'));

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /-swift-version/);
  });
});

describe('compareXCFrameworks — architectures within a slice', () => {
  const simulatorBinary = (root: string) =>
    path.join(root, SIMULATOR, `${PRODUCT}.framework`, PRODUCT);

  it('detects a symbol that differs only in the x86_64 half of a fat binary', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.writeFileSync(simulatorBinary(a), fatBinary({ arm64: NM_TEXT, x86_64: NM_TEXT }));
    fs.writeFileSync(
      simulatorBinary(b),
      fatBinary({
        arm64: NM_TEXT,
        x86_64: NM_TEXT.split('\n')
          .filter((line) => !line.includes('_EXFontCreateWithName'))
          .join('\n'),
      })
    );

    const report = compareXCFrameworks(a, b, options);

    assert.deepEqual(
      report.differences.map((d) => [d.slice, d.architecture, d.kind]),
      [[SIMULATOR, 'x86_64', 'symbols']]
    );
    assert.deepEqual(report.differences[0].onlyInA, ['_EXFontCreateWithName']);
    assert.match(formatEquivalenceReport(report), /x86_64/);
  });

  it('detects an architecture present on the first side only', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.writeFileSync(simulatorBinary(a), fatBinary({ arm64: NM_TEXT, x86_64: NM_TEXT }));
    fs.writeFileSync(simulatorBinary(b), fatBinary({ arm64: NM_TEXT }));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.kind === 'structure');
    assert.ok(difference, 'expected a structure difference');
    assert.deepEqual(difference.onlyInA, ['x86_64']);
    assert.match(formatEquivalenceReport(report), /x86_64/);
  });

  it('detects an architecture present on the second side only (S1)', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.writeFileSync(simulatorBinary(a), fatBinary({ arm64: NM_TEXT }));
    fs.writeFileSync(simulatorBinary(b), fatBinary({ arm64: NM_TEXT, x86_64: NM_TEXT }));

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.kind === 'structure');
    assert.ok(difference, 'expected a structure difference');
    assert.deepEqual(difference.onlyInB, ['x86_64']);
    assert.deepEqual(difference.onlyInA, []);
  });

  it('still compares a thin single-architecture binary', () => {
    const a = makeXCFramework(['ios-arm64']);
    const b = clone(a);
    rewrite(slicePath(b, PRODUCT), (text) =>
      text
        .split('\n')
        .filter((line) => !line.includes('_EXFontCreateWithName'))
        .join('\n')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.deepEqual(
      report.differences.map((d) => [d.slice, d.architecture, d.kind]),
      [['ios-arm64', 'arm64', 'symbols']]
    );
    assert.deepEqual(report.differences[0].onlyInA, ['_EXFontCreateWithName']);
  });
});

describe('formatEquivalenceReport', () => {
  it('leads with the verdict (A5)', () => {
    const a = makeXCFramework();
    const report = compareXCFrameworks(a, clone(a), options);
    assert.match(formatEquivalenceReport(report).split('\n')[0], /^Equivalent/);
  });
});

describe('normalizeArtifactText', () => {
  it('replaces a path under a known root but keeps the flag that carried it', () => {
    assert.equal(
      normalizeArtifactText(`// swift-module-flags: -I ${REPO_ROOT}/packages/x -Onone\n`, [
        REPO_ROOT,
      ]),
      '// swift-module-flags: -I <PATH> -Onone'
    );
  });

  it('leaves a path outside every known root alone', () => {
    assert.equal(
      normalizeArtifactText('// swift-module-flags: -I /opt/homebrew/include\n', [REPO_ROOT]),
      '// swift-module-flags: -I /opt/homebrew/include'
    );
  });

  it('leaves a rooted path inside a string literal alone', () => {
    assert.equal(
      normalizeArtifactText(`public let p: Swift.String = "${REPO_ROOT}/packages/x"\n`, [
        REPO_ROOT,
      ]),
      `public let p: Swift.String = "${REPO_ROOT}/packages/x"`
    );
  });

  it('does not treat a sibling directory as the root', () => {
    assert.equal(
      normalizeArtifactText(`-I ${REPO_ROOT}-other/packages/x\n`, [REPO_ROOT]),
      `-I ${REPO_ROOT}-other/packages/x`
    );
  });

  it('strips trailing whitespace and normalizes line endings', () => {
    assert.equal(
      normalizeArtifactText('import Foundation  \r\nimport Swift\r\n\n', []),
      'import Foundation\nimport Swift'
    );
  });
});

/** A vendored SPM dependency ships as a second framework inside the same slice. */
function addFramework(root: string, name: string, binary: string): void {
  for (const slice of fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())) {
    const framework = path.join(root, slice.name, `${name}.framework`);
    fs.outputFileSync(path.join(framework, name), binary);
    fs.outputFileSync(path.join(framework, 'Info.plist'), '<plist/>');
    fs.outputFileSync(
      path.join(framework, 'Modules', 'module.modulemap'),
      `framework module ${name} {\n    umbrella header "${name}.h"\n    export *\n}\n`
    );
  }
}

const DEPENDENCY_NM_TEXT = [
  '0000000000004b10 T _SDWebImageDownloaderStart',
  '00000000000114a0 S _OBJC_CLASS_$_SDImageCache',
  '',
].join('\n');

describe('compareXCFrameworks — a slice holding more than one framework (C3)', () => {
  it('compares the second framework too, and names it', () => {
    const a = makeXCFramework();
    addFramework(a, 'SDWebImage', DEPENDENCY_NM_TEXT);
    const b = clone(a);
    rewrite(path.join(b, 'ios-arm64', 'SDWebImage.framework', 'SDWebImage'), (text) =>
      text
        .split('\n')
        .filter((line) => !line.includes('_SDWebImageDownloaderStart'))
        .join('\n')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.deepEqual(
      report.differences.map((d) => [d.slice, d.architecture, d.kind]),
      [['ios-arm64', 'arm64', 'symbols']]
    );
    assert.deepEqual(report.differences[0].onlyInA, ['_SDWebImageDownloaderStart']);
    assert.match(report.differences[0].summary, /^Exported symbols differ in SDWebImage \(arm64\)/);
  });

  it('detects an architecture missing from the second framework only', () => {
    const a = makeXCFramework();
    addFramework(
      a,
      'SDWebImage',
      fatBinary({ arm64: DEPENDENCY_NM_TEXT, x86_64: DEPENDENCY_NM_TEXT })
    );
    const b = clone(a);
    fs.writeFileSync(
      path.join(b, SIMULATOR, 'SDWebImage.framework', 'SDWebImage'),
      fatBinary({ arm64: DEPENDENCY_NM_TEXT })
    );

    const report = compareXCFrameworks(a, b, options);

    assert.deepEqual(
      report.differences.map((d) => [d.slice, d.kind]),
      [[SIMULATOR, 'structure']]
    );
    assert.deepEqual(report.differences[0].onlyInA, ['x86_64']);
    assert.match(report.differences[0].summary, /SDWebImage/);
  });
});

describe('compareXCFrameworks — a framework carrying no binary (round 6b item 4)', () => {
  function stripBinaries(root: string): void {
    for (const slice of ['ios-arm64', SIMULATOR]) {
      fs.removeSync(path.join(root, slice, `${PRODUCT}.framework`, PRODUCT));
    }
  }

  it('reports a framework whose binary is missing from both sides, rather than comparing none', () => {
    const a = makeXCFramework();
    const b = clone(a);
    stripBinaries(a);
    stripBinaries(b);

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.deepEqual(
      report.differences.map((d) => d.slice),
      ['ios-arm64', SIMULATOR]
    );
    assert.match(formatEquivalenceReport(report), /ExpoFont\.framework carries no ExpoFont binary/);
  });

  it('leaves a framework with binaries on both sides alone', () => {
    const a = makeXCFramework();

    assert.deepEqual(compareXCFrameworks(a, clone(a), options).differences, []);
  });
});

describe('compareXCFrameworks — entry kind, not only entry name (round 6b item 5)', () => {
  it('reports a path that is a directory on one side and a file on the other', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.mkdirpSync(path.join(a, 'ios-arm64', 'Frameworks'));
    fs.outputFileSync(path.join(b, 'ios-arm64', 'Frameworks'), '');

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.summary.includes('Frameworks'));
    assert.ok(difference, 'expected the directory/file mismatch to be reported');
    assert.deepEqual(difference.onlyInA, ['Frameworks (directory)']);
    assert.deepEqual(difference.onlyInB, ['Frameworks (file)']);
    assert.equal(report.equivalent, false);
  });

  it('reports a header replaced by a directory instead of reading the directory as text', () => {
    const a = makeXCFramework();
    const b = clone(a);
    const header = slicePath(b, 'Headers', 'EXFontLoader.h');
    fs.removeSync(header);
    fs.mkdirpSync(header);

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /EXFontLoader\.h \(directory\)/);
  });
});

describe('compareXCFrameworks — a .swiftinterface outside a framework (round 6b item 6)', () => {
  const loose = (root: string) => path.join(root, 'ios-arm64', 'ExpoFontLoose.swiftinterface');

  it('reports one that sits in a slice on one side only', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.outputFileSync(loose(a), INTERFACE);

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /ExpoFontLoose\.swiftinterface/);
  });

  it('compares the contents of one both sides carry', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.outputFileSync(loose(a), INTERFACE);
    fs.outputFileSync(
      loose(b),
      INTERFACE.replace('public func unload(name: Swift.String)', 'public func unload()')
    );

    const report = compareXCFrameworks(a, b, options);

    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /public func unload\(\)/);
  });
});

describe('compareXCFrameworks — a slice holding no framework (review item 2)', () => {
  const CATALYST = 'ios-arm64_x86_64-maccatalyst';

  it('compares the contents of a slice that holds no .framework', () => {
    const a = makeXCFramework();
    const b = clone(a);
    for (const root of [a, b]) {
      fs.outputFileSync(path.join(root, CATALYST, BUNDLE, 'Info.plist'), '<plist/>');
    }
    fs.outputFileSync(path.join(a, CATALYST, BUNDLE, 'PrivacyInfo.xcprivacy'), PRIVACY_INFO);

    const report = compareXCFrameworks(a, b, options);

    const difference = report.differences.find((d) => d.slice === CATALYST);
    assert.ok(difference, 'expected the frameworkless slice to be compared');
    assert.match(difference.summary, /PrivacyInfo\.xcprivacy/);
    assert.equal(report.equivalent, false);
  });

  it('still refuses an artifact in which no slice holds a framework', () => {
    const a = makeXCFramework();
    const b = clone(a);
    for (const slice of ['ios-arm64', SIMULATOR]) {
      fs.removeSync(path.join(a, slice, `${PRODUCT}.framework`));
    }

    assert.throws(() => compareXCFrameworks(a, b, options), { message: /no platform slice/ });
  });
});

describe('round 6c item 2: every interface belongs to a comparison', () => {
  it('keeps a loose symlink to an indexed interface in the tree comparison', () => {
    const a = makeXCFramework();
    const b = clone(a);
    fs.symlinkSync(
      'ExpoFont.swiftmodule/arm64-apple-ios.swiftinterface',
      slicePath(a, 'Modules/Loose.swiftinterface')
    );

    const report = compareXCFrameworks(a, b, options);
    assert.equal(report.equivalent, false);
    assert.match(formatEquivalenceReport(report), /Loose.swiftinterface/);
  });

  for (const relative of [
    'Modules/Loose.swiftinterface',
    'Resources/Loose.swiftinterface',
    'Modules/ExpoFont.swiftmodule/nested/Loose.swiftinterface',
  ]) {
    it(`detects a one-sided ${relative}`, () => {
      const a = makeXCFramework();
      fs.ensureDirSync(path.dirname(slicePath(a, relative)));
      const b = clone(a);
      fs.outputFileSync(slicePath(a, relative), INTERFACE);
      const report = compareXCFrameworks(a, b, options);
      assert.equal(report.equivalent, false);
      assert.match(formatEquivalenceReport(report), /Loose.swiftinterface|nested/);
    });

    it(`compares changed text in ${relative}`, () => {
      const a = makeXCFramework();
      fs.outputFileSync(slicePath(a, relative), INTERFACE);
      const b = clone(a);
      rewrite(slicePath(b, relative), (text) =>
        text.replace('public func unload(name: Swift.String)', 'public func unload()')
      );
      const report = compareXCFrameworks(a, b, options);
      assert.equal(report.equivalent, false);
      assert.match(formatEquivalenceReport(report), /public func unload\(\)/);
    });
  }

  for (const symlinks of [false, true]) {
    it(`ignores a one-sided versioned package interface with symlinks=${symlinks}`, () => {
      const a = makeXCFramework();
      const b = clone(a);
      for (const root of [a, b]) {
        fs.moveSync(slicePath(root, 'Modules'), slicePath(root, 'Versions/A/Modules'));
        if (symlinks) {
          fs.symlinkSync('A', slicePath(root, 'Versions/Current'));
          fs.symlinkSync('Versions/Current/Modules', slicePath(root, 'Modules'));
        }
      }
      fs.removeSync(
        slicePath(
          b,
          'Versions/A/Modules/ExpoFont.swiftmodule/arm64-apple-ios.package.swiftinterface'
        )
      );
      const report = compareXCFrameworks(a, b, options);
      assert.equal(report.equivalent, true, formatEquivalenceReport(report));
    });

    it(`compares versioned macOS interfaces with symlinks=${symlinks}`, () => {
      const a = makeXCFramework();
      const b = clone(a);
      for (const root of [a, b]) {
        fs.moveSync(slicePath(root, 'Modules'), slicePath(root, 'Versions/A/Modules'));
        if (symlinks) {
          fs.symlinkSync('A', slicePath(root, 'Versions/Current'));
          fs.symlinkSync('Versions/Current/Modules', slicePath(root, 'Modules'));
        }
      }
      assert.equal(compareXCFrameworks(a, b, options).equivalent, true);
      rewrite(
        slicePath(b, 'Versions/A/Modules/ExpoFont.swiftmodule/arm64-apple-ios.swiftinterface'),
        (text) => text.replace('public func unload(name: Swift.String)', 'public func unload()')
      );
      const report = compareXCFrameworks(a, b, options);
      assert.equal(report.equivalent, false);
      assert.match(formatEquivalenceReport(report), /public func unload\(\)/);
    });
  }
});
