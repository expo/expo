import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCustomBuildEnv } from './CustomBuild';

const inheritedEnv: NodeJS.ProcessEnv = { PATH: '/usr/bin', HOME: '/Users/me' };

describe('createCustomBuildEnv', () => {
  it('sets only the pipeline variables when the config has no env', () => {
    assert.deepEqual(
      createCustomBuildEnv({
        inheritedEnv,
        podsRoot: '/stage/pods',
        customBuildRoot: '/stage/custom-build',
        platformName: 'iphoneos',
      }),
      {
        PATH: '/usr/bin',
        HOME: '/Users/me',
        PODS_ROOT: '/stage/pods',
        EXPO_CUSTOM_BUILD_ROOT: '/stage/custom-build',
        PLATFORM_NAME: 'iphoneos',
      }
    );
  });

  it('passes the config env to the script', () => {
    const env = createCustomBuildEnv({
      inheritedEnv,
      configEnv: { EXPO_JSI_HIDE_SWIFT_RUNTIME_EXPORTS: '1', HOME: '/override' },
      podsRoot: '/stage/pods',
    });
    assert.equal(env.EXPO_JSI_HIDE_SWIFT_RUNTIME_EXPORTS, '1');
    assert.equal(env.HOME, '/override');
    assert.equal(env.PATH, '/usr/bin');
  });

  it('keeps the pipeline variables when the config env sets the same names', () => {
    const env = createCustomBuildEnv({
      inheritedEnv,
      configEnv: {
        PODS_ROOT: '/config/pods',
        EXPO_CUSTOM_BUILD_ROOT: '/config/custom-build',
        PLATFORM_NAME: 'appletvos',
      },
      podsRoot: '/stage/pods',
      customBuildRoot: '/stage/custom-build',
      platformName: 'iphoneos',
    });
    assert.equal(env.PODS_ROOT, '/stage/pods');
    assert.equal(env.EXPO_CUSTOM_BUILD_ROOT, '/stage/custom-build');
    assert.equal(env.PLATFORM_NAME, 'iphoneos');
  });

  it('ignores pipeline variable names in the config env when the pipeline leaves them unset', () => {
    const env = createCustomBuildEnv({
      inheritedEnv: { ...inheritedEnv, PLATFORM_NAME: 'macosx' },
      configEnv: { EXPO_CUSTOM_BUILD_ROOT: '/config/custom-build', PLATFORM_NAME: 'appletvos' },
      podsRoot: '/stage/pods',
    });
    assert.equal('EXPO_CUSTOM_BUILD_ROOT' in env, false);
    assert.equal('PLATFORM_NAME' in env, false);
  });

  it('does not modify the inherited env', () => {
    const inherited = { ...inheritedEnv, PLATFORM_NAME: 'macosx' };
    createCustomBuildEnv({
      inheritedEnv: inherited,
      configEnv: { EXTRA: '1' },
      podsRoot: '/stage/pods',
    });
    assert.deepEqual(inherited, { ...inheritedEnv, PLATFORM_NAME: 'macosx' });
  });
});
