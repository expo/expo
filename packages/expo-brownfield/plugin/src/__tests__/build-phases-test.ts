import { IOSConfig } from 'expo/config-plugins';
import path from 'node:path';

import { configureBuildPhases, createFramework } from '../ios/utils/project';

describe('Brownfield build phases', () => {
  it('should embed a bundle without changing the application bundle phase', () => {
    const project = IOSConfig.XcodeUtils.getPbxproj(
      path.resolve(__dirname, '../../../../../templates/expo-template-bare-minimum')
    );
    const phasesBefore = JSON.stringify(project.hash.project.objects.PBXShellScriptBuildPhase);
    const target = createFramework(project, 'FeatureKit', 'com.example.feature');

    configureBuildPhases(project, target, 'FeatureKit', 'HelloWorld');

    const phases = project.hash.project.objects.PBXShellScriptBuildPhase;
    const bundlePhase = target.pbxNativeTarget.buildPhases
      .map(({ value }) => phases[value])
      .find((phase) => phase?.name === '"Bundle Expo brownfield code and images"');

    expect(bundlePhase).toBeDefined();
    expect(bundlePhase?.shellScript).toContain('expo-brownfield/package.json');
    for (const [key, value] of Object.entries(JSON.parse(phasesBefore))) {
      expect(phases[key]).toEqual(value);
    }
  });
});
