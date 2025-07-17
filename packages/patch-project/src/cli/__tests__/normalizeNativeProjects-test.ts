import { IOSConfig } from 'expo/config-plugins';
import path from 'node:path';

import { normalizeXcodeProjectAsync } from '../normalizeNativeProjects';

jest.mock('expo/config-plugins');

describe(normalizeXcodeProjectAsync, () => {
  it('should remove generated properties', async () => {
    const mockGetProjectName = IOSConfig.XcodeUtils.getProjectName as jest.MockedFunction<
      typeof IOSConfig.XcodeUtils.getProjectName
    >;
    mockGetProjectName.mockReturnValueOnce('sdk53');

    const project = await normalizeXcodeProjectAsync(
      '/app',
      path.join(__dirname, 'fixtures', 'sdk53.pbxproj')
    );
    const serializedText = JSON.stringify(project.toJSON(), null, 2);
    expect(serializedText).not.toMatch(/ExpoModulesProvider\.swift/);
    expect(serializedText).not.toMatch(/PrivacyInfo\.xcprivacy/);
    expect(serializedText).not.toMatch(/noop-file\.swift/);
    expect(serializedText).not.toMatch(/Pods/);
    expect(serializedText).not.toMatch(/Supporting/);
    expect(serializedText).not.toMatch(/[Expo] Configure project/);
    expect(serializedText).not.toMatch(/[CP] Embed Pods Frameworks/);
    expect(serializedText).not.toMatch(/[CP] Check Pods Manifest\.lock/);
    expect(serializedText).not.toMatch(/[CP] Copy Pods Resources/);
  });
});
