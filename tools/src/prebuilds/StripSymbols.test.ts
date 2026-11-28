import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import os from 'os';
import path from 'path';

import { stripReleaseSymbolsAsync } from './StripSymbols';

const PRODUCT = 'ExpoFoo';

// Stand-ins for xcrun and codesign record each call. codesign -d treats a framework as signed
// when it has a _CodeSignature folder; xcrun strip fails on a binary that contains "fail".
const FAKE_XCRUN = `#!/bin/bash
echo "xcrun $*" >> "$CALL_LOG"
if grep -q fail "\${@: -1}"; then echo "strip: malformed object" >&2; exit 1; fi
`;
const FAKE_CODESIGN = `#!/bin/bash
echo "codesign $*" >> "$CALL_LOG"
if [ "$1" = "-d" ] && [ ! -d "$2/_CodeSignature" ]; then exit 1; fi
exit 0
`;

let tmpDir: string;
let xcframeworkPath: string;
let callLog: string;
let originalPath: string | undefined;

beforeEach(async () => {
  tmpDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'strip-symbols-test-')));
  xcframeworkPath = path.join(tmpDir, `${PRODUCT}.xcframework`);
  callLog = path.join(tmpDir, 'calls.log');
  const fakeBin = path.join(tmpDir, 'bin');
  await fs.outputFile(path.join(fakeBin, 'xcrun'), FAKE_XCRUN, { mode: 0o755 });
  await fs.outputFile(path.join(fakeBin, 'codesign'), FAKE_CODESIGN, { mode: 0o755 });
  originalPath = process.env.PATH;
  process.env.PATH = `${fakeBin}:${originalPath}`;
  process.env.CALL_LOG = callLog;
});

afterEach(async () => {
  process.env.PATH = originalPath;
  delete process.env.CALL_LOG;
  await fs.remove(tmpDir);
});

type SliceOptions = { dSYM?: boolean; signed?: boolean; versioned?: boolean; binary?: string };

const frameworkPath = (slice: string) => path.join(xcframeworkPath, slice, `${PRODUCT}.framework`);

async function addSliceAsync(slice: string, options: SliceOptions = {}): Promise<string> {
  const { dSYM = true, signed = false, versioned = false, binary = 'binary' } = options;
  const framework = frameworkPath(slice);
  let binaryPath = path.join(framework, PRODUCT);
  if (versioned) {
    binaryPath = path.join(framework, 'Versions', 'A', PRODUCT);
    await fs.outputFile(binaryPath, binary);
    await fs.symlink('A', path.join(framework, 'Versions', 'Current'));
    await fs.symlink(`Versions/Current/${PRODUCT}`, path.join(framework, PRODUCT));
  } else {
    await fs.outputFile(binaryPath, binary);
  }
  if (signed) {
    await fs.mkdirp(path.join(framework, '_CodeSignature'));
  }
  if (dSYM) {
    await fs.mkdirp(path.join(xcframeworkPath, slice, 'dSYMs', `${PRODUCT}.framework.dSYM`));
  }
  return binaryPath;
}

async function readCallsAsync(): Promise<string[]> {
  if (!(await fs.pathExists(callLog))) {
    return [];
  }
  return (await fs.readFile(callLog, 'utf8')).trim().split('\n');
}

const stripCalls = (calls: string[]) => calls.filter((call) => call.startsWith('xcrun strip'));
const signCalls = (calls: string[]) => calls.filter((call) => call.includes('--sign'));

describe('stripReleaseSymbolsAsync', () => {
  it('strips local symbols from the real binary of each Release slice that has a dSYM', async () => {
    const device = await addSliceAsync('ios-arm64');
    const catalyst = await addSliceAsync('ios-arm64_x86_64-maccatalyst', { versioned: true });
    await addSliceAsync('ios-arm64_x86_64-simulator', { dSYM: false });

    await stripReleaseSymbolsAsync(
      xcframeworkPath,
      PRODUCT,
      ['ios-arm64', 'ios-arm64_x86_64-maccatalyst', 'ios-arm64_x86_64-simulator'],
      'Release'
    );

    assert.deepEqual(stripCalls(await readCallsAsync()), [
      `xcrun strip -x ${device}`,
      `xcrun strip -x ${catalyst}`,
    ]);
  });

  it('re-signs a signed framework ad hoc after the strip', async () => {
    const binary = await addSliceAsync('ios-arm64', { signed: true });

    await stripReleaseSymbolsAsync(xcframeworkPath, PRODUCT, ['ios-arm64'], 'Release');

    const calls = await readCallsAsync();
    const framework = frameworkPath('ios-arm64');
    assert.deepEqual(calls.slice(-2), [
      `xcrun strip -x ${binary}`,
      `codesign --force --sign - ${framework}`,
    ]);
  });

  it('does not sign an unsigned framework', async () => {
    await addSliceAsync('ios-arm64');

    await stripReleaseSymbolsAsync(xcframeworkPath, PRODUCT, ['ios-arm64'], 'Release');

    const calls = await readCallsAsync();
    assert.equal(stripCalls(calls).length, 1);
    assert.deepEqual(signCalls(calls), []);
  });

  it('does not strip a Debug xcframework', async () => {
    await addSliceAsync('ios-arm64', { signed: true });

    await stripReleaseSymbolsAsync(xcframeworkPath, PRODUCT, ['ios-arm64'], 'Debug');

    assert.deepEqual(await readCallsAsync(), []);
  });

  it('throws an error that names the binary when the strip fails', async () => {
    const binary = await addSliceAsync('ios-arm64', { binary: 'fail' });

    await assert.rejects(
      stripReleaseSymbolsAsync(xcframeworkPath, PRODUCT, ['ios-arm64'], 'Release'),
      (error: Error) => {
        assert.match(error.message, /Failed to strip local symbols/);
        assert.ok(error.message.includes(binary));
        assert.match(error.message, /malformed object/);
        return true;
      }
    );
  });
});
