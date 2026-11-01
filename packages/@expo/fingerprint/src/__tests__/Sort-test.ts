import spawnAsync from '@expo/spawn-async';
import path from 'path';

import type { FingerprintSource, HashSource } from '../Fingerprint.types';
import { sortSources } from '../Sort';

describe(sortSources, () => {
  it(`should sort sources by type in 'file > dir > contents' order`, () => {
    const sources: HashSource[] = [
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
    ];

    expect(sortSources(sources)).toEqual([
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
    ]);
  });

  it(`should sort id or filePath when item types are the same`, () => {
    const sources: HashSource[] = [
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'] },
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'contents', id: 'bar', contents: 'bartender', reasons: ['bar'] },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
    ];

    expect(sortSources(sources)).toEqual([
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'] },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
      { type: 'contents', id: 'bar', contents: 'bartender', reasons: ['bar'] },
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
    ]);
  });

  it(`should support both HashSource and FingerprintSource types`, () => {
    const sources: HashSource[] = [
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
    ];
    const fingerprintSources: FingerprintSource[] = [
      {
        type: 'contents',
        id: 'foo',
        contents: 'HelloWorld',
        reasons: ['foo'],
        hash: 'bc9faaae1e35d52f3dea9651da12cd36627b8403',
      },
    ];

    expect(sortSources(sources)).toEqual(sources);
    expect(sortSources(fingerprintSources)).toEqual(fingerprintSources);
  });

  it('should sort sources by override hash key', () => {
    const sources: HashSource[] = [
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'], overrideHashKey: '_first' },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'], overrideHashKey: '_first' },
    ];

    expect(sortSources(sources)).toEqual([
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'], overrideHashKey: '_first' },
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'], overrideHashKey: '_first' },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
    ]);
  });

  it('should sort independently of the process locale', async () => {
    // Croatian collation treats "nj" as a digraph sorted after "nz", the opposite of English.
    // The fingerprint must not depend on the developer's locale, otherwise a runtime version
    // computed locally never matches the one computed on EAS.
    const sources: HashSource[] = [
      { type: 'file', filePath: '/app/nz.json', reasons: ['x'] },
      { type: 'file', filePath: '/app/nj.json', reasons: ['x'] },
      { type: 'dir', filePath: '/app/nz', reasons: ['x'] },
      { type: 'dir', filePath: '/app/nj', reasons: ['x'] },
      { type: 'contents', id: 'nz', contents: '', reasons: ['x'] },
      { type: 'contents', id: 'nj', contents: '', reasons: ['x'] },
      {
        type: 'package',
        filePath: '/app/node_modules/nz/package.json',
        name: 'nz',
        version: '1.0.0',
        reasons: ['x'],
      },
      {
        type: 'package',
        filePath: '/app/node_modules/nj/package.json',
        name: 'nj',
        version: '1.0.0',
        reasons: ['x'],
      },
    ];

    expect(await sortSourcesInLocaleAsync(sources, 'hr_HR.UTF-8')).toEqual(
      await sortSourcesInLocaleAsync(sources, 'en_US.UTF-8')
    );
  });
});

/**
 * Sorts sources in a child Node process whose default locale is `locale`,
 * since the default locale of the current process cannot be changed at runtime.
 */
async function sortSourcesInLocaleAsync(sources: HashSource[], locale: string): Promise<string[]> {
  const script = `
    const { compareSource } = require(${JSON.stringify(path.join(__dirname, '..', 'Sort.ts'))});
    const sources = JSON.parse(process.argv[1]);
    const sorted = sources.sort(compareSource);
    console.log(JSON.stringify(sorted.map((source) => source.filePath ?? source.id ?? source.name)));
  `;
  const { stdout } = await spawnAsync(
    process.execPath,
    [
      '-r',
      require.resolve('ts-node/register/transpile-only'),
      '-e',
      script,
      JSON.stringify(sources),
    ],
    {
      cwd: path.join(__dirname, '..', '..'),
      env: { ...process.env, LC_ALL: locale, LANG: locale },
    }
  );
  return JSON.parse(stdout);
}
