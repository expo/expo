import fs from 'fs';
import resolveFrom from 'resolve-from';

import {
  shouldUpdateDeployTargetPodfileAsync,
  updateDeploymentTargetPodfile,
} from '../withIosDeploymentTarget';

jest.mock('fs', () => ({ promises: { readFile: jest.fn() } }));
jest.mock('resolve-from');

describe(updateDeploymentTargetPodfile, () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const mockResolve = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockResolve.mockReturnValue('/app/node_modules/react-native/scripts/react_native_pods.rb');
  });

  it('should update deployment target in Podfile', async () => {
    const contents = `\
platform :ios, '10.0'

target 'HelloWorld' do
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;

    const expectContents = `\
platform :ios, '12.0'

target 'HelloWorld' do
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;
    expect(await updateDeploymentTargetPodfile('/app', contents, '12.0')).toEqual(expectContents);
  });

  it(`should replace react-native's min_ios_version_supported if we need higher version`, async () => {
    const reactNativePodsRubyContent = `\
def min_ios_version_supported
  return '12.4'
end`;
    (fs.promises.readFile as jest.Mock).mockResolvedValue(reactNativePodsRubyContent);
    const contents = `\
platform :ios, min_ios_version_supported

target 'HelloWorld' do
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;

    const expectContents = `\
platform :ios, '13.0'

target 'HelloWorld' do
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;
    expect(await updateDeploymentTargetPodfile('/app', contents, '13.0')).toEqual(expectContents);
  });

  it('should support multiple deployment targets in Podfile', async () => {
    const contents = `\
target 'HelloWorld' do
  platform :ios, '10.0'
  use_react_native!(
    :path => config[:reactNativePath]
  )
end

target 'HelloWorld2' do
  platform :ios, '9.0'
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;

    const expectContents = `\
target 'HelloWorld' do
  platform :ios, '12.0'
  use_react_native!(
    :path => config[:reactNativePath]
  )
end

target 'HelloWorld2' do
  platform :ios, '12.0'
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;
    expect(await updateDeploymentTargetPodfile('/app', contents, '12.0')).toEqual(expectContents);
  });

  it('should leave unmodified if deployment target meets requirements', async () => {
    const contents = `\
platform :ios, '12.0'

target 'HelloWorld' do
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;

    expect(await updateDeploymentTargetPodfile('/app', contents, '12.0')).toEqual(contents);
  });

  it(`should leave unmodified if react-native's min_ios_version_supported meets requirement`, async () => {
    const reactNativePodsRubyContent = `\
def min_ios_version_supported
  return '12.4'
end`;
    (fs.promises.readFile as jest.Mock).mockResolvedValue(reactNativePodsRubyContent);
    const contents = `\
platform :ios, min_ios_version_supported

target 'HelloWorld' do
  use_react_native!(
    :path => config[:reactNativePath]
  )
end
`;

    expect(await updateDeploymentTargetPodfile('/app', contents, '12.0')).toEqual(contents);
  });
});

describe(shouldUpdateDeployTargetPodfileAsync, () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const mockResolve = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockResolve.mockReturnValue('/app/node_modules/react-native/scripts/react_native_pods.rb');
  });

  it('should returns true when target version is higher than current version', async () => {
    const podfileContent = `platform :ios, '11.0'`;
    (fs.promises.readFile as jest.Mock).mockResolvedValue(podfileContent);

    const result = await shouldUpdateDeployTargetPodfileAsync('/app', '13.0');
    expect(result).toBe(true);
  });

  it('should returns false when target version is equal to current version', async () => {
    const podfileContent = `platform :ios, '12.4'`;
    (fs.promises.readFile as jest.Mock).mockResolvedValue(podfileContent);

    const result = await shouldUpdateDeployTargetPodfileAsync('/app', '12.4');
    expect(result).toBe(false);
  });

  it('should returns true when target version is higher than min_ios_version_supported version', async () => {
    const podfileContent = `platform :ios, min_ios_version_supported`;
    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(podfileContent);
    const reactNativePodsRubyContent = `\
def min_ios_version_supported
  return '12.4'
end`;
    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(reactNativePodsRubyContent);

    const result = await shouldUpdateDeployTargetPodfileAsync('/app', '13.0');
    expect(result).toBe(true);
  });

  it('should returns false when target version is equal to min_ios_version_supported version', async () => {
    const podfileContent = `platform :ios, min_ios_version_supported`;
    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(podfileContent);
    const reactNativePodsRubyContent = `\
def min_ios_version_supported
  return '12.4'
end`;
    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(reactNativePodsRubyContent);

    const result = await shouldUpdateDeployTargetPodfileAsync('/app', '12.4');
    expect(result).toBe(false);
  });

  it('should show a warning when the Podfile content is not supported', async () => {
    const podfileContent = `platform :ios, something || '14.0'`;
    (fs.promises.readFile as jest.Mock).mockResolvedValue(podfileContent);
    const spy = jest.spyOn(console, 'warn');
    await shouldUpdateDeployTargetPodfileAsync('/app', '13.0');
    expect(spy).toBeCalled();
  });
});
