import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import { XcodeProject } from '../../Plugin.types';
import * as WarningAggregator from '../../utils/warnings';
import { setBitcodeWithConfig } from '../Bitcode';
import { getPbxproj, isNotComment } from '../utils/Xcodeproj';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');
jest.mock('../../utils/warnings');

describe(setBitcodeWithConfig, () => {
  const projectRoot = '/tablet';
  beforeEach(async () => {
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

  afterEach(() => {
    vol.reset();
  });

  it('defaults to not modifying the bitcode settings', async () => {
    setBitcodeEnabledForRoot({ ios: {} }, projectRoot, validateDefaultBitcode);
  });

  it('enables bitcode for everything', async () => {
    setBitcodeEnabledForRoot({ ios: { bitcode: true } }, projectRoot, project => {
      const configurations = getConfigurations(project);
      for (const [, configuration] of configurations) {
        expect(configuration.buildSettings.ENABLE_BITCODE).toBe('YES');
      }
    });
  });

  it('disables bitcode for everything', async () => {
    setBitcodeEnabledForRoot({ ios: { bitcode: false } }, projectRoot, project => {
      const configurations = getConfigurations(project);
      for (const [, configuration] of configurations) {
        expect(configuration.buildSettings.ENABLE_BITCODE).toBe('NO');
      }
    });
  });

  it('enables bitcode on specific configuration', async () => {
    setBitcodeEnabledForRoot({ ios: { bitcode: 'Debug' } }, projectRoot, project => {
      const configurations = getConfigurations(project);
      for (const [, configuration] of configurations) {
        // ensure all others are disabled
        expect(configuration.buildSettings.ENABLE_BITCODE).toBe(
          configuration.name === 'Debug' ? 'YES' : 'NO'
        );
      }
    });
  });

  it('warns when enabling bitcode on an invalid configuration', async () => {
    setBitcodeEnabledForRoot({ ios: { bitcode: 'Bacon' } }, projectRoot, validateDefaultBitcode);
    expect(WarningAggregator.addWarningIOS).toHaveBeenLastCalledWith(
      'ios.bitcode',
      'No configuration named "Bacon". Expected one of: "Debug", "Release".'
    );
  });
});

function getConfigurations(project: XcodeProject) {
  return Object.entries(project.pbxXCBuildConfigurationSection()).filter(isNotComment);
}

function setBitcodeEnabledForRoot(
  config: { ios?: { bitcode?: boolean | string } & any },
  projectRoot: string,
  validate: (project: XcodeProject) => void
) {
  let project = getPbxproj(projectRoot);
  project = setBitcodeWithConfig(config, { project });
  validate(project);
  fs.writeFileSync(project.filepath, project.writeSync());
}

function validateDefaultBitcode(project: XcodeProject) {
  const configurations = getConfigurations(project);
  for (const [id, configuration] of configurations) {
    expect(configuration.buildSettings.ENABLE_BITCODE).toBe(
      // Ensure nothing changed.
      {
        '13B07F941A680F5B00A75B9A': 'NO',
        '13B07F951A680F5B00A75B9A': undefined,
        '83CBBA201A601CBA00E9B192': undefined,
        '83CBBA211A601CBA00E9B192': undefined,
      }[id]
    );
  }
}
