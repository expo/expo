/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getPlatformExtension from '../getPlatformExtension';

const PLATFORMS = new Set(['ios', 'android']);

describe('getPlatformExtension', () => {
  test('should get platform ext', () => {
    expect(getPlatformExtension('a.ios.js', PLATFORMS)).toBe('ios');
    expect(getPlatformExtension('a.android.js', PLATFORMS)).toBe('android');
    expect(getPlatformExtension('c.android/a.ios.js', PLATFORMS)).toBe('ios');
    expect(getPlatformExtension('/b/c/a.ios.js', PLATFORMS)).toBe('ios');
    expect(getPlatformExtension('/b/c/a@1.5x.ios.png', PLATFORMS)).toBe('ios');
    expect(getPlatformExtension('/b/c/a@1.5x.lol.png', PLATFORMS)).toBe(null);
    expect(getPlatformExtension('/b/c/a.lol.png', PLATFORMS)).toBe(null);
  });
});
