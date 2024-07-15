import { ExpoConfig } from '@expo/config-types';
import * as fs from 'fs';
import { vol } from 'memfs';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as WarningAggregator from '../../utils/warnings';
import {
  formatDeviceFamilies,
  getDeviceFamilies,
  getIsTabletOnly,
  getSupportsTablet,
  setDeviceFamily,
} from '../DeviceFamily';
import { getPbxproj } from '../utils/Xcodeproj';

jest.mock('fs');
jest.mock('../../utils/warnings');

const TABLET_AND_PHONE_SUPPORTED = [1, 2];
const ONLY_PHONE_SUPPORTED = [1];
const ONLY_TABLET_SUPPORTED = [2];

describe(getDeviceFamilies, () => {
  it(`warns about invalid config`, () => {
    getDeviceFamilies({ macos: { isTabletOnly: true, supportsTablet: false } } as any);
    expect(WarningAggregator.addWarningMacOS).toHaveBeenLastCalledWith(
      'macos.supportsTablet',
      'Found contradictory values: `{ macos: { isTabletOnly: true, supportsTablet: false } }`. Using `{ isTabletOnly: true }`.'
    );
  });
});

describe('device family', () => {
  it(`returns false macos.isTabletOnly is not provided`, () => {
    expect(getIsTabletOnly({ macos: {} })).toBe(false);
  });

  it(`returns true macos.isTabletOnly is provided`, () => {
    expect(getIsTabletOnly({ macos: { isTabletOnly: true } })).toBe(true);
  });

  it(`returns false macos.supportsTablet is provided`, () => {
    expect(getSupportsTablet({ macos: {} })).toBe(false);
  });

  it(`returns true macos.supportsTablet is provided`, () => {
    expect(getSupportsTablet({ macos: { supportsTablet: true } })).toBe(true);
  });

  it(`supports tablet and mobile if supportsTablet is true`, () => {
    expect(getDeviceFamilies({ macos: { supportsTablet: true } })).toEqual(
      TABLET_AND_PHONE_SUPPORTED
    );
  });

  it(`supports only mobile if supportsTablet is blank/false and isTabletOnly is blank/false`, () => {
    expect(getDeviceFamilies({ macos: {} })).toEqual(ONLY_PHONE_SUPPORTED);
    expect(getDeviceFamilies({ macos: { supportsTablet: false, isTabletOnly: false } })).toEqual(
      ONLY_PHONE_SUPPORTED
    );
  });

  it(`supports only tablet if isTabletOnly is true`, () => {
    expect(getDeviceFamilies({ macos: { isTabletOnly: true } })).toEqual(ONLY_TABLET_SUPPORTED);
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
  //   expect(setDeviceFamily({ macos: { supportsTablet: true } }, {})).toMatchObject({
  //     UIDeviceFamily: TABLET_AND_PHONE_SUPPORTED,
  //   });
  // });
});

describe(setDeviceFamily, () => {
  const projectRoot = '/tablet';
  beforeAll(async () => {
    vol.fromJSON(
      {
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/testproject/AppDelegate.m': '',
      },
      projectRoot
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it('updates device families without throwing', async () => {
    setDeviceFamilyForRoot({ name: '', slug: '', macos: {} }, projectRoot);
    setDeviceFamilyForRoot({ name: '', slug: '', macos: { supportsTablet: true } }, projectRoot);
    setDeviceFamilyForRoot({ name: '', slug: '', macos: { isTabletOnly: true } }, projectRoot);
  });
});

function setDeviceFamilyForRoot(config: ExpoConfig, projectRoot: string) {
  let project = getPbxproj(projectRoot);
  project = setDeviceFamily(config, { project });
  fs.writeFileSync(project.filepath, project.writeSync());
}
