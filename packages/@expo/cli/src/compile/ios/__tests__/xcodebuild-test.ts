import spawnAsync from '@expo/spawn-async';

import { getAppPathAsync, getXcodeBuildArgs } from '../xcodebuild';

const props = {
  configuration: 'Debug' as const,
  scheme: 'my-app',
  xcodeProject: {
    isWorkspace: true,
    name: 'my-app.xcworkspace',
  },
};

describe(getXcodeBuildArgs, () => {
  it(`returns the generic simulator arguments`, () => {
    expect(getXcodeBuildArgs(props)).toEqual([
      '-workspace',
      'my-app.xcworkspace',
      '-configuration',
      'Debug',
      '-scheme',
      'my-app',
      '-destination',
      'generic/platform=iOS Simulator',
      'COCOAPODS_PARALLEL_CODE_SIGN=true',
      'COMPILER_INDEX_STORE_ENABLE=NO',
    ]);
  });
});

describe(getAppPathAsync, () => {
  it(`returns the built app path`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: JSON.stringify([
        {
          target: 'other-app',
          buildSettings: {
            TARGET_BUILD_DIR: '/DerivedData/Build/Products/Debug-iphonesimulator',
            WRAPPER_NAME: 'other-app.app',
          },
        },
        {
          target: 'my-app',
          buildSettings: {
            TARGET_BUILD_DIR: '/DerivedData/Build/Products/Debug-iphonesimulator',
            WRAPPER_NAME: 'my-app.app',
          },
        },
      ]),
    } as any);

    await expect(getAppPathAsync(props)).resolves.toBe(
      '/DerivedData/Build/Products/Debug-iphonesimulator/my-app.app'
    );
    expect(spawnAsync).toHaveBeenCalledWith('xcodebuild', [
      ...getXcodeBuildArgs(props),
      '-showBuildSettings',
      '-json',
    ]);
  });

  it(`throws when xcodebuild returns malformed JSON`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ stdout: 'not json' } as any);

    await expect(getAppPathAsync(props)).rejects.toThrow(
      /Could not parse JSON returned from "xcodebuild -showBuildSettings -json"\.\n\nnot json\n\nError: /
    );
  });
});
