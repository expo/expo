import fs from 'fs';
import path from 'path';

import { modifyLegacyAppDelegate, modifyAppDelegate } from '../withDevLauncherAppDelegate';

describe('legacy', () => {
  describe(modifyLegacyAppDelegate, () => {
    it(`modifies the AppDelegate file for dev-launcher`, () => {
      const fixture = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
        'utf8'
      );
      expect(modifyLegacyAppDelegate(fixture, null)).toMatchSnapshot();
    });

    it(`modifies the AppDelegate file for dev-launcher with incompatible updates`, () => {
      const fixture = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
        'utf8'
      );
      expect(modifyLegacyAppDelegate(fixture, '0.5.4')).toMatchSnapshot();
    });

    it(`modifies the AppDelegate file for dev-launcher with compatible updates`, () => {
      const fixture = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
        'utf8'
      );
      expect(modifyLegacyAppDelegate(fixture, '0.7.0')).toMatchSnapshot();
    });

    it(`modifying AppDelegate twice doesn't change the content`, () => {
      const firstModification = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
        'utf8'
      );
      modifyLegacyAppDelegate(firstModification, '0.7.0');
      const secondModification = `${firstModification}`;
      modifyLegacyAppDelegate(secondModification, '0.7.0');
      expect(secondModification).toBe(firstModification);
    });
  });
});

describe(modifyAppDelegate, () => {
  it(`modifies the AppDelegate file for dev-launcher`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, null)).toMatchSnapshot();
  });

  it(`modifies the AppDelegate file for dev-launcher with incompatible updates`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, '0.5.4')).toMatchSnapshot();
  });

  it(`modifies the AppDelegate file for dev-launcher with compatible updates`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, '0.7.0')).toMatchSnapshot();
  });

  it(`modifying AppDelegate twice doesn't change the content`, () => {
    const firstModification = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules.m'),
      'utf8'
    );
    modifyAppDelegate(firstModification, '0.7.0');
    const secondModification = `${firstModification}`;
    modifyAppDelegate(secondModification, '0.7.0');
    expect(secondModification).toBe(firstModification);
  });
});

describe('modifyAppDelegate expo-screen-orientation compatibility', () => {
  it(`modifies the AppDelegate file for dev-launcher`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules-screen-orientation.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, null)).toMatchSnapshot();
  });

  it(`modifies the AppDelegate file for dev-launcher with incompatible updates`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules-screen-orientation.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, '0.5.4')).toMatchSnapshot();
  });

  it(`modifies the AppDelegate file for dev-launcher with compatible updates`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules-screen-orientation.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, '0.7.0')).toMatchSnapshot();
  });

  it(`modifying AppDelegate twice doesn't change the content`, () => {
    const firstModification = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-expo-modules-screen-orientation.m'),
      'utf8'
    );
    modifyAppDelegate(firstModification, '0.7.0');
    const secondModification = `${firstModification}`;
    modifyAppDelegate(secondModification, '0.7.0');
    expect(secondModification).toBe(firstModification);
  });
});
