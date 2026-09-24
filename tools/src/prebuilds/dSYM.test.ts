/**
 * Tests for analyzeDwarfPrefixMapping — the classifier behind the `dsym-bad-paths` check.
 *
 * The fixtures mirror `dwarfdump --debug-info --recurse-depth=0` output taken from
 * ExpoHaptics.framework.dSYM and ExpoModulesCore.framework.dSYM.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { analyzeDwarfPrefixMapping } from './dSYM';

/** Both real dSYMs compile from SwiftPM's staging directory — that is expected. */
const STAGING_COMP_DIR =
  '/expo-src/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/.swiftpm/xcode';

/** Renders compile unit headers the way dwarfdump prints them. */
const dwarfDump = (compDir: string, names: string[]): string =>
  [
    'ExpoHaptics:\tfile format Mach-O arm64',
    '',
    '.debug_info contents:',
    ...names.flatMap((name, index) => [
      `0x0000000${index}: Compile Unit: length = 0x00023d80, format = DWARF32, version = 0x0004, abbr_offset = 0x0000, addr_size = 0x08`,
      '',
      `0x0000000${index}b: DW_TAG_compile_unit`,
      '              DW_AT_producer\t("Apple clang version 21.0.0 (clang-2100.3.34.2)")',
      `              DW_AT_name\t("${name}")`,
      '              DW_AT_APPLE_sdk\t("iPhoneOS27.0.sdk")',
      `              DW_AT_comp_dir\t("${compDir}")`,
      '              DW_AT_low_pc\t(0x0000000000004000)',
    ]),
  ].join('\n');

describe('analyzeDwarfPrefixMapping', () => {
  it('accepts the source paths of a real ExpoHaptics dSYM', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, ['/expo-src/packages/expo-haptics/ios/HapticsModule.swift'])
    );

    assert.equal(result.success, true);
  });

  it('accepts the source paths of a real ExpoModulesCore dSYM, including <swift-imported-modules>', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(
        '/expo-src/packages/precompile/.build/expo-modules-core/generated/ExpoModulesCore/.swiftpm/xcode',
        [
          '/expo-src/packages/expo-modules-core/common/cpp/EventEmitter.cpp',
          '/expo-src/packages/expo-modules-core/ios/AppContext.swift',
          '<swift-imported-modules>',
        ]
      )
    );

    assert.equal(result.success, true);
  });

  it('accepts sources of a package resolved from node_modules', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, [
        '/expo-src/node_modules/react-native-reanimated/ios/REAModule.mm',
      ])
    );

    assert.equal(result.success, true);
  });

  it('accepts a system source path', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump('/Applications/Xcode-27.0.0.app/Contents/Developer', [
        '/Applications/Xcode-27.0.0.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/21.0.0/include/stddef.h',
      ])
    );

    assert.equal(result.success, true);
  });

  it('accepts a generated source file, which this repo produces on purpose', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, [
        '/expo-src/packages/expo-modules-core/ios/generated/ExpoModulesProvider.swift',
      ])
    );

    assert.equal(result.success, true);
  });

  it('accepts a source generated at build time, which has no checkout path to resolve to', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, [
        '/expo-src/generated/react-native-screens/RNScreens/RNScreens_codegen_components/Foo.cpp',
      ])
    );

    assert.equal(result.success, true);
  });

  it('fails when a build-time generated source leaks its staging path', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, [
        '/expo-src/packages/precompile/.build/react-native-screens/generated/RNScreens/RNScreens_codegen_components/Foo.cpp',
      ])
    );

    assert.equal(result.success, false);
  });

  it('fails when a source file name points into the SwiftPM staging directory', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, [
        '/expo-src/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/src/HapticsModule.swift',
      ])
    );

    assert.equal(result.success, false);
    assert.match(result.details ?? '', /HapticsModule\.swift/);
    assert.match(result.details ?? '', /-debug-prefix-map/);
  });

  it('fails when a source file name was never remapped', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, ['/Users/someone/repos/expo/packages/expo-haptics/ios/Foo.swift'])
    );

    assert.equal(result.success, false);
  });

  it('still fails when the compilation directory was never remapped', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump('/Users/someone/repos/expo/packages/precompile/.build', [
        '/expo-src/packages/expo-haptics/ios/HapticsModule.swift',
      ])
    );

    assert.equal(result.success, false);
    assert.match(result.message, /unmapped absolute path/);
  });

  it('fails a staging source path even when no compilation directory is present', () => {
    const result = analyzeDwarfPrefixMapping(
      [
        '.debug_info contents:',
        '0x00000000: DW_TAG_compile_unit',
        '              DW_AT_name\t("/expo-src/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/src/HapticsModule.swift")',
      ].join('\n')
    );

    assert.equal(result.success, false);
    assert.match(result.message, /unresolvable source path/);
  });

  it('fails a relative staging source path', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, ['../../.build/expo-haptics/generated/HapticsModule.swift'])
    );

    assert.equal(result.success, false);
    assert.match(result.message, /unresolvable source path/);
  });

  it('fails a relative source path, which resolves against the staging comp_dir', () => {
    const result = analyzeDwarfPrefixMapping(
      dwarfDump(STAGING_COMP_DIR, ['ExpoHaptics/src/HapticsModule.swift'])
    );

    assert.equal(result.success, false);
    assert.match(result.message, /unresolvable source path/);
  });

  it('fails when compile units carry no source file name at all', () => {
    const result = analyzeDwarfPrefixMapping(
      [
        '.debug_info contents:',
        '0x00000000: DW_TAG_compile_unit',
        '              DW_AT_name [DW_FORM_strx1]\t(indexed (00000e) string = "HapticsModule.swift")',
        `              DW_AT_comp_dir\t("${STAGING_COMP_DIR}")`,
      ].join('\n')
    );

    assert.equal(result.success, false);
    assert.match(result.message, /no source file name/);
  });

  it('passes a dump with no compile units', () => {
    const result = analyzeDwarfPrefixMapping('.debug_info contents:\n');

    assert.equal(result.success, true);
    assert.match(result.message, /may be stripped/);
  });
});
