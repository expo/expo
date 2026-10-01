import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLipoArchs, parseNmOutput } from './SymbolTable';

describe('parseNmOutput', () => {
  it('reads Swift mangled, ObjC class and plain C symbols', () => {
    const output = [
      '000000000000aedc T _$s8ExpoFont010unregisterB03urlSbSo8CFURLRefa_tKF',
      '0000000000018768 D _$s8ExpoFont013UnregisteringB15FailedExceptionCMm',
      '00000000000114a0 S _OBJC_CLASS_$_EXFontLoader',
      '00000000000114c0 S _OBJC_METACLASS_$_EXFontLoader',
      '0000000000005b0c T _EXFontCreateWithName',
      '',
    ].join('\n');

    assert.deepEqual([...parseNmOutput(output)].sort(), [
      '_$s8ExpoFont010unregisterB03urlSbSo8CFURLRefa_tKF',
      '_$s8ExpoFont013UnregisteringB15FailedExceptionCMm',
      '_EXFontCreateWithName',
      '_OBJC_CLASS_$_EXFontLoader',
      '_OBJC_METACLASS_$_EXFontLoader',
    ]);
  });

  it('skips architecture and object-file headers', () => {
    const output = [
      '/tmp/ExpoFont (for architecture x86_64):',
      '0000000000005b0c T _EXFontCreateWithName',
      '/tmp/ExpoFont (for architecture arm64):',
      '0000000000005b0c T _EXFontCreateWithName',
      'ExpoFontLoader.o:',
      '0000000000000010 T _EXFontLoad',
    ].join('\n');

    assert.deepEqual([...parseNmOutput(output)].sort(), ['_EXFontCreateWithName', '_EXFontLoad']);
  });

  it('reads symbols printed without an address column', () => {
    assert.deepEqual(
      [...parseNmOutput('                 S _OBJC_CLASS_$_EXFontLoader\n')],
      ['_OBJC_CLASS_$_EXFontLoader']
    );
  });

  it('returns an empty set for an empty table', () => {
    assert.equal(parseNmOutput('').size, 0);
    assert.equal(parseNmOutput('\n\n').size, 0);
  });

  it('reads a symbol whose name ends in a colon', () => {
    assert.deepEqual([...parseNmOutput('0000000000000000 T api:\n')], ['api:']);
  });

  it('throws on malformed input that happens to end in a colon', () => {
    assert.throws(() => parseNmOutput('nm: error reading /tmp/ExpoFont:\n'), /not a symbol/);
  });

  it('throws on malformed input rather than yielding an empty set', () => {
    assert.throws(
      () =>
        parseNmOutput('nm: error: /tmp/ExpoFont: not a Mach-O file\n', { source: '/tmp/ExpoFont' }),
      (error: Error) => {
        assert.match(error.message, /not a Mach-O file/);
        assert.match(error.message, /\/tmp\/ExpoFont/);
        assert.match(error.message, /nm -gU/);
        return true;
      }
    );
  });

  it('names the offending line number when a line is unrecognised', () => {
    const output = ['0000000000005b0c T _EXFontCreateWithName', 'what is this'].join('\n');
    assert.throws(() => parseNmOutput(output), /line 2/);
  });
});

describe('parseLipoArchs', () => {
  it('reads the architectures of a fat binary', () => {
    assert.deepEqual(parseLipoArchs('x86_64 arm64\n'), ['x86_64', 'arm64']);
  });

  it('reads a thin binary as a single architecture', () => {
    assert.deepEqual(parseLipoArchs('arm64\n'), ['arm64']);
  });

  it('throws when lipo names no architecture', () => {
    assert.throws(
      () => parseLipoArchs('\n', '/tmp/ExpoFont'),
      (error: Error) => {
        assert.match(error.message, /\/tmp\/ExpoFont/);
        assert.match(error.message, /lipo -archs/);
        return true;
      }
    );
  });
});
