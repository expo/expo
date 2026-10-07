import { getXcodeBuildArgs } from '../xcodebuild';

describe(getXcodeBuildArgs, () => {
  it(`returns the generic simulator arguments`, () => {
    expect(
      getXcodeBuildArgs({
        configuration: 'Debug',
        scheme: 'my-app',
        xcodeProject: {
          isWorkspace: true,
          name: 'my-app.xcworkspace',
        },
      })
    ).toEqual([
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
