import { vol } from 'memfs';
import path from 'path';

import { getInfoPlistPathFromPbxproj } from '../getInfoPlistPath';

jest.mock('fs');

const originalFs = jest.requireActual('fs');

const projectRoot = '/app/';

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
  const plistPath = getInfoPlistPathFromPbxproj(projectRoot, {
    targetName: 'multitarget',
  });
  expect(plistPath).toBe('multitarget/Info.plist');
});
it('returns with default props', () => {
  const plistPath = getInfoPlistPathFromPbxproj(projectRoot);
  expect(plistPath).toBe('multitarget/Info.plist');
});
it('returns with custom target name', () => {
  const plistPath = getInfoPlistPathFromPbxproj(projectRoot, { targetName: 'shareextension' });
  expect(plistPath).toBe('shareextension/Info.plist');
});
it('throws on invalid target name', () => {
  expect(() =>
    getInfoPlistPathFromPbxproj(projectRoot, { targetName: 'shareextension-invalid' })
  ).toThrowError(/Could not find target/);
});
