import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPodInstallAppDirs, updateModuleTemplateVersions } from './BumpReactNativeVersion';

describe('getPodInstallAppDirs', () => {
  it('maps tracked Podfile.lock paths to unique app dirs with expo-go last', () => {
    assert.deepEqual(
      getPodInstallAppDirs([
        'apps/expo-go/ios/Podfile.lock',
        'apps/bare-expo/ios/Podfile.lock',
        'apps/brownfield-tester/integrated/ios/Podfile.lock',
        'apps/bare-expo/ios/Podfile.lock',
      ]),
      ['apps/bare-expo', 'apps/brownfield-tester/integrated', 'apps/expo-go']
    );
  });
});

describe('updateModuleTemplateVersions', () => {
  it('bumps react-native and @react-native/* versions in the EJS module template', () => {
    const template = [
      '  "devDependencies": {',
      '<% if (usesExpoUI) { -%>',
      '    "@expo/ui": "~58.0.14",',
      '<% } -%>',
      '    "@react-native/jest-preset": "0.88.0-rc.3",',
      '    "react": "19.3.0",',
      '    "react-native": "0.88.0-rc.3"',
      '  },',
      '  "peerDependencies": {',
      '    "react-native": "*"',
      '  }',
    ].join('\n');

    assert.equal(
      updateModuleTemplateVersions(template, '0.88.0'),
      template.replaceAll('"0.88.0-rc.3"', '"0.88.0"')
    );
  });
});
