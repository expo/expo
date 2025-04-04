import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import {
  getApplicationTargetNameForSchemeAsync,
  getArchiveBuildConfigurationForSchemeAsync,
  getRunnableSchemesFromXcodeproj,
} from '../BuildScheme';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

describe(getRunnableSchemesFromXcodeproj, () => {
  const platform = 'ios';

  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/project.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project-multitarget.pbxproj'),
          'utf-8'
        ),
      },
      '/app'
    );
  });

  afterAll(() => {
    vol.reset();
  });
  it(`parses for runnable schemes`, async () => {
    const schemes = getRunnableSchemesFromXcodeproj('/app', platform);
    expect(schemes).toStrictEqual([
      { name: 'multitarget', osType: 'iOS', type: 'com.apple.product-type.application' },
      { name: 'shareextension', osType: 'iOS', type: 'com.apple.product-type.app-extension' },
    ]);
  });
});

describe(getApplicationTargetNameForSchemeAsync, () => {
  const platform = 'ios';

  describe('single build action entry', () => {
    beforeAll(async () => {
      vol.fromJSON(
        {
          'ios/testproject.xcodeproj/xcshareddata/xcschemes/testproject.xcscheme':
            fsReal.readFileSync(path.join(__dirname, 'fixtures/testproject.xcscheme'), 'utf-8'),
        },
        '/app'
      );
    });

    afterAll(() => {
      vol.reset();
    });

    it('returns the target name for existing scheme', async () => {
      const target = await getApplicationTargetNameForSchemeAsync('/app', platform, 'testproject');
      expect(target).toBe('testproject');
    });

    it('throws if the scheme does not exist', async () => {
      await expect(() =>
        getApplicationTargetNameForSchemeAsync('/app', platform, 'nonexistentscheme')
      ).rejects.toThrow(/does not exist/);
    });
  });
  describe('multiple build action entries', () => {
    beforeAll(async () => {
      vol.fromJSON(
        {
          'ios/testproject.xcodeproj/xcshareddata/xcschemes/testproject.xcscheme':
            fsReal.readFileSync(path.join(__dirname, 'fixtures/testproject-2.xcscheme'), 'utf-8'),
        },
        '/app'
      );
    });

    afterAll(() => {
      vol.reset();
    });

    it('returns the target name for existing scheme', async () => {
      const target = await getApplicationTargetNameForSchemeAsync('/app', platform, 'testproject');
      expect(target).toBe('testproject');
    });

    it('throws if the scheme does not exist', async () => {
      await expect(() =>
        getApplicationTargetNameForSchemeAsync('/app', platform, 'nonexistentscheme')
      ).rejects.toThrow(/does not exist/);
    });
  });
});

describe(getArchiveBuildConfigurationForSchemeAsync, () => {
  const platform = 'ios';

  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/xcshareddata/xcschemes/testproject.xcscheme':
          fsReal.readFileSync(path.join(__dirname, 'fixtures/testproject.xcscheme'), 'utf-8'),
      },
      '/app'
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it('returns build configuration name for existing scheme', async () => {
    const buildConfiguration = await getArchiveBuildConfigurationForSchemeAsync(
      '/app',
      platform,
      'testproject'
    );
    expect(buildConfiguration).toBe('Release');
  });

  it('throws if the scheme does not exist', async () => {
    await expect(() =>
      getArchiveBuildConfigurationForSchemeAsync('/app', platform, 'nonexistentscheme')
    ).rejects.toThrow(/does not exist/);
  });
});
