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
});
