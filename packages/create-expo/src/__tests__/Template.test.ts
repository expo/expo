import path from 'path';

import { resolvePackageModuleId } from '../Template';

describe(resolvePackageModuleId, () => {
  it(`resolves 'file:' path`, () => {
    const result = resolvePackageModuleId('file:./path/to/template.tgz');
    expect(result).toEqual({
      type: 'file',
      uri: expect.stringMatching('./path/to/template.tgz'),
    });
    expect(result.type === 'file' && path.isAbsolute(result.uri)).toBe(true);
  });
  it(`resolves darwin local path`, () => {
    expect(resolvePackageModuleId('./path/to/template.tgz')).toEqual({
      type: 'file',
      uri: expect.stringMatching('./path/to/template.tgz'),
    });
  });
  it(`resolves windows local path`, () => {
    expect(resolvePackageModuleId('.\\path\\to\\template.tgz')).toEqual({
      type: 'file',
      uri: expect.stringMatching(/template\.tgz$/),
    });
  });
  it(`resolves module ID`, () => {
    expect(resolvePackageModuleId('@expo/basic@34.0.0')).toEqual({
      type: 'npm',
      uri: '@expo/basic@34.0.0',
    });
    expect(resolvePackageModuleId('basic')).toEqual({
      type: 'npm',
      uri: 'basic',
    });
  });
  it('resolves github repository url', () => {
    expect(
      resolvePackageModuleId(
        'https://github.com/expo/expo/tree/sdk-49/templates/expo-template-bare-minimum'
      )
    ).toEqual({
      type: 'repository',
      uri: {
        owner: 'expo',
        name: 'expo',
        ref: 'sdk-49',
        folder: 'templates/expo-template-bare-minimum',
      },
    });
  });
  it('throws for invalid github repository url', () => {
    expect(() => resolvePackageModuleId('https://github.com')).toThrow('Invalid GitHub url');
    expect(() => resolvePackageModuleId('https://github.com/expo')).toThrow('Invalid GitHub url');
  });
});
