import { vol } from 'memfs';
import path from 'path';

import { getInfoPlistPathFromPbxproj } from '../getInfoPlistPath';

jest.mock('fs');

const originalFs = jest.requireActual('fs');

const projectRoot = '/app/';
const platform = 'ios';

beforeAll(() => {
  vol.fromJSON(
    {
      'ios/testproject.xcodeproj/project.pbxproj': originalFs.readFileSync(
        path.join(__dirname, '../../__tests__/fixtures/project-multitarget.pbxproj'),
        'utf-8'
      ),
      'ios/testproject.xcodeproj/xcshareddata/xcschemes/multitarget.xcscheme':
        originalFs.readFileSync(
          path.join(__dirname, '../../__tests__/fixtures/multitarget.xcscheme'),
          'utf-8'
        ),
    },
    projectRoot
  );
});
it('returns correct Info.plist path for the default build configuration (Release)', () => {
  const plistPath = getInfoPlistPathFromPbxproj(projectRoot, platform, {
    targetName: 'multitarget',
  });
  expect(plistPath).toBe('multitarget/Info.plist');
});
it('returns with default props', () => {
  const plistPath = getInfoPlistPathFromPbxproj(projectRoot, platform);
  expect(plistPath).toBe('multitarget/Info.plist');
});
it('returns with custom target name', () => {
  const plistPath = getInfoPlistPathFromPbxproj(projectRoot, platform, {
    targetName: 'shareextension',
  });
  expect(plistPath).toBe('shareextension/Info.plist');
});
it('throws on invalid target name', () => {
  expect(() =>
    getInfoPlistPathFromPbxproj(projectRoot, platform, {
      targetName: 'shareextension-invalid',
    })
  ).toThrowError(/Could not find target/);
});
