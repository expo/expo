import type { ExpoConfig } from '@expo/config-types';
import { vol } from 'memfs';
import path from 'path';
import xcode from 'xcode';

import { compileMockModWithResultsAsync } from '../../plugins/__tests__/mockMods';
import { withPodfileProperties, withXcodeProject } from '../../plugins/ios-plugins';
import {
  getDeploymentTarget,
  setDeploymentTargetForBuildConfiguration,
  updateDeploymentTargetForPbxproj,
  withDeploymentTarget,
  withDeploymentTargetPodfileProps,
} from '../DeploymentTarget';

const fs = jest.requireActual('fs') as typeof import('fs');

const baseExpoConfig: ExpoConfig = {
  name: 'testproject',
  slug: 'testproject',
  platforms: ['ios'],
  version: '1.0.0',
};

jest.mock('fs');
jest.mock('node:fs', () => require('memfs').fs);
jest.mock('../../plugins/ios-plugins');

describe('DeploymentTarget module', () => {
  describe(getDeploymentTarget, () => {
    it('returns `null` if no `deploymentTarget` is set', () => {
      expect(getDeploymentTarget(baseExpoConfig)).toBe(null);
    });

    it('returns the `deploymentTarget` when provided', () => {
      const expoConfig = { ...baseExpoConfig, ios: { deploymentTarget: '15.1' } };
      expect(getDeploymentTarget(expoConfig)).toBe('15.1');
    });
  });

  describe(setDeploymentTargetForBuildConfiguration, () => {
    it('sets the IPHONEOS_DEPLOYMENT_TARGET in buildSettings', () => {
      const buildConfig = { buildSettings: {} } as any;
      setDeploymentTargetForBuildConfiguration(buildConfig, '16.0');
      expect(buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBe('16.0');
    });

    it('does not set IPHONEOS_DEPLOYMENT_TARGET if deploymentTarget is undefined', () => {
      const buildConfig = { buildSettings: {} } as any;
      setDeploymentTargetForBuildConfiguration(buildConfig, undefined);
      expect(buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBeUndefined();
    });
  });

  describe(updateDeploymentTargetForPbxproj, () => {
    const projectRoot = '/testproject';
    const pbxProjPath = 'ios/testproject.xcodeproj/project.pbxproj';

    afterEach(() => vol.reset());

    it('updates IPHONEOS_DEPLOYMENT_TARGET in native target build configurations', () => {
      const fixtureWithOldTarget = fs.readFileSync(
        path.join(__dirname, 'fixtures/project-multitarget.pbxproj'),
        'utf-8'
      );
      vol.fromJSON({ [pbxProjPath]: fixtureWithOldTarget }, projectRoot);

      // Load and parse the project
      const project = xcode.project(path.join(projectRoot, pbxProjPath));
      project.parseSync();

      // Update the deployment target
      const updatedProject = updateDeploymentTargetForPbxproj(project, '16.0');

      // The project should be returned
      expect(updatedProject).toBe(project);

      // Verify the project was modified by writing and checking the output
      const output = project.writeSync();
      // The new deployment target should appear in the output for native targets
      expect(output).toContain('IPHONEOS_DEPLOYMENT_TARGET = 16.0');
    });
  });
});

describe(withDeploymentTarget, () => {
  it('does not modify project when deploymentTarget is not set', async () => {
    const mockProject = {
      pbxXCBuildConfigurationSection: () => ({}),
    };

    const { modResults } = await compileMockModWithResultsAsync(
      { ...baseExpoConfig },
      {
        plugin: withDeploymentTarget,
        mod: withXcodeProject,
        modResults: mockProject as any,
      }
    );

    // Project should be unchanged
    expect(modResults).toBe(mockProject);
  });
});

describe(withDeploymentTargetPodfileProps, () => {
  const DEPLOYMENT_TARGET_PROP_KEY = 'ios.deploymentTarget';

  it('sets the property from ios.deploymentTarget config', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { ios: { deploymentTarget: '15.1' } },
      {
        plugin: withDeploymentTargetPodfileProps,
        mod: withPodfileProperties,
        modResults: {},
      }
    );
    expect(modResults).toMatchObject({
      [DEPLOYMENT_TARGET_PROP_KEY]: '15.1',
    });
  });

  it('does not set the property when deploymentTarget is not provided', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withDeploymentTargetPodfileProps,
        mod: withPodfileProperties,
        modResults: {},
      }
    );
    expect(modResults[DEPLOYMENT_TARGET_PROP_KEY]).toBeUndefined();
  });

  it('overwrites the property if an old property exists', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { ios: { deploymentTarget: '16.0' } },
      {
        plugin: withDeploymentTargetPodfileProps,
        mod: withPodfileProperties,
        modResults: { [DEPLOYMENT_TARGET_PROP_KEY]: '15.0' } as Record<string, string>,
      }
    );
    expect(modResults).toMatchObject({
      [DEPLOYMENT_TARGET_PROP_KEY]: '16.0',
    });
  });
});
