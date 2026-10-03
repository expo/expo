import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPodInstallAppDirs } from './BumpReactNativeVersion';

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
