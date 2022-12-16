import { ExpoConfig } from '@expo/config-types';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import * as WarningAggregator from '../../utils/warnings';
import {
  formatDeviceFamilies,
  getDeviceFamilies,
  getIsTabletOnly,
  getSupportsTablet,
  setDeviceFamily,
} from '../DeviceFamily';
import { getPbxproj } from '../utils/Xcodeproj';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');
jest.mock('../../utils/warnings');

const TABLET_AND_PHONE_SUPPORTED = [1, 2];
const ONLY_PHONE_SUPPORTED = [1];
const ONLY_TABLET_SUPPORTED = [2];

describe(getDeviceFamilies, () => {
  it(`warns about invalid config`, () => {
    getDeviceFamilies({ ios: { isTabletOnly: true, supportsTablet: false } } as any);
    expect(WarningAggregator.addWarningIOS).toHaveBeenLastCalledWith(
      'ios.supportsTablet',
      'Found contradictory values: `{ ios: { isTabletOnly: true, supportsTablet: false } }`. Using `{ isTabletOnly: true }`.'
    );
  });
});

describe('device family', () => {
  it(`returns false ios.isTabletOnly is not provided`, () => {
    expect(getIsTabletOnly({ ios: {} })).toBe(false);
  });

  it(`returns true ios.isTabletOnly is provided`, () => {
    expect(getIsTabletOnly({ ios: { isTabletOnly: true } })).toBe(true);
  });

  it(`returns false ios.supportsTablet is provided`, () => {
    expect(getSupportsTablet({ ios: {} })).toBe(false);
  });

  it(`returns true ios.supportsTablet is provided`, () => {
    expect(getSupportsTablet({ ios: { supportsTablet: true } })).toBe(true);
  });

  it(`supports tablet and mobile if supportsTablet is true`, () => {
    expect(getDeviceFamilies({ ios: { supportsTablet: true } })).toEqual(
      TABLET_AND_PHONE_SUPPORTED
    );
  });

  it(`supports only mobile if supportsTablet is blank/false and isTabletOnly is blank/false`, () => {
    expect(getDeviceFamilies({ ios: {} })).toEqual(ONLY_PHONE_SUPPORTED);
    expect(getDeviceFamilies({ ios: { supportsTablet: false, isTabletOnly: false } })).toEqual(
      ONLY_PHONE_SUPPORTED
    );
  });

  it(`supports only tablet if isTabletOnly is true`, () => {
    expect(getDeviceFamilies({ ios: { isTabletOnly: true } })).toEqual(ONLY_TABLET_SUPPORTED);
  });

  // It's important that this format is always correct.
  // Otherwise the xcode parser will throw `Expected ".", "/*", ";", or [0-9] but "," found.` when we attempt to write to it.
  it(`formats the families correctly`, () => {
    expect(formatDeviceFamilies([1])).toEqual(`"1"`);
    expect(formatDeviceFamilies([1, 2, 3])).toEqual(`"1,2,3"`);
  });

  // TODO: update tests to run against pbxproj
  // it(`sets to phone only if no value is provided`, () => {
  //   expect(setDeviceFamily({}, {})).toMatchObject({ UIDeviceFamily: ONLY_PHONE_SUPPORTED });
  // });

  // it(`sets to given config when provided`, () => {
  //   expect(setDeviceFamily({ ios: { supportsTablet: true } }, {})).toMatchObject({
  //     UIDeviceFamily: TABLET_AND_PHONE_SUPPORTED,
  //   });
  // });
});

describe(setDeviceFamily, () => {
  const projectRoot = '/tablet';
  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it('updates device families without throwing', async () => {
    setDeviceFamilyForRoot({ name: '', slug: '', ios: {} }, projectRoot);
    setDeviceFamilyForRoot({ name: '', slug: '', ios: { supportsTablet: true } }, projectRoot);
    setDeviceFamilyForRoot({ name: '', slug: '', ios: { isTabletOnly: true } }, projectRoot);
  });
});

function setDeviceFamilyForRoot(config: ExpoConfig, projectRoot: string) {
  let project = getPbxproj(projectRoot);
  project = setDeviceFamily(config, { project });
  fs.writeFileSync(project.filepath, project.writeSync());
}
