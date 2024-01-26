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
    ).toMatchObject({
      type: 'repository',
      uri: expect.objectContaining({
        pathname: '/expo/expo/tree/sdk-49/templates/expo-template-bare-minimum',
      }),
    });
  });
});
