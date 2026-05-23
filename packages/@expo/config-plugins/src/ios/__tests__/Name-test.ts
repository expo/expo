import type { ExpoConfig } from '@expo/config-types';
import fs from 'fs';
import { vol } from 'memfs';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import { getName, setDisplayName, setName, setProductName } from '../Name';
import { findFirstNativeTarget } from '../Target';
import { getBuildConfigurationsForListId, getPbxproj } from '../utils/Xcodeproj';

jest.mock('fs');

describe(getName, () => {
  it(`returns null if no bundleIdentifier is provided`, () => {
    expect(getName({} as any)).toBe(null);
  });

  it(`returns the name if provided`, () => {
    expect(getName({ name: 'Some iOS app' })).toBe('Some iOS app');
  });
});
describe(setDisplayName, () => {
  it(`sets the CFBundleDisplayName if name is given`, () => {
    expect(setDisplayName({ name: 'Expo app' }, {})).toMatchObject({
      CFBundleDisplayName: 'Expo app',
    });
  });
});
describe(setName, () => {
  it(`makes no changes to the infoPlist no name is provided`, () => {
    expect(setName({} as any, {})).toMatchObject({});
  });
});
describe(setProductName, () => {
  const projectRoot = '/';
  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`sets the iOS PRODUCT_NAME value on every build configuration of the application target`, () => {
    for (const [input, output] of [
      ['My Cool Thing', 'MyCoolThing'],
      ['h"&<world/>🚀', 'hworld'],
    ]) {
      // Ensure the value can be parsed and written.
      const project = setProductNameForRoot({ name: input, slug: '' }, projectRoot);

      const [, nativeTarget] = findFirstNativeTarget(project);
      const buildConfigurations = getBuildConfigurationsForListId(
        project,
        nativeTarget.buildConfigurationList
      );

      // PRODUCT_NAME should be set on every configuration of the app target.
      // Values are stored unquoted; the serializer wraps them at write time
      // only when the heuristic deems it necessary (spaces, special chars).
      expect(buildConfigurations.length).toBeGreaterThan(0);
      for (const [, buildConfig] of buildConfigurations) {
        expect(buildConfig.buildSettings.PRODUCT_NAME).toBe(output);
      }
    }
  });

  it(`writes the PRODUCT_NAME to the serialized pbxproj`, () => {
    const project = setProductNameForRoot({ name: 'My Cool Thing', slug: '' }, projectRoot);
    const output = project.writeSync();
    // The sanitized PRODUCT_NAME is a safe identifier, so it serializes
    // unquoted (`PRODUCT_NAME = MyCoolThing;`). Either form is valid pbxproj.
    expect(output).toMatch(/PRODUCT_NAME = (MyCoolThing|"MyCoolThing");/);
    // The default PRODUCT_NAME (HelloWorld) should no longer appear.
    expect(output).not.toMatch(/PRODUCT_NAME = HelloWorld;/);
  });
});

function setProductNameForRoot(config: ExpoConfig, projectRoot: string) {
  let project = getPbxproj(projectRoot);
  project = setProductName(config, project);
  fs.writeFileSync(project.filepath, project.writeSync());
  return project;
}
