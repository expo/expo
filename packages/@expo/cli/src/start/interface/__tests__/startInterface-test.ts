import { resolveLaunchPropsAsync } from '../../../run/android/resolveLaunchProps';
import { startInterfaceAsync } from '../startInterface';

jest.mock('../../../run/android/resolveLaunchProps');
jest.mock('../interactiveActions', () => ({
  DevServerManagerActions: jest.fn(() => ({
    printDevServerInfo: jest.fn(),
  })),
}));
jest.mock('../../../utils/prompts', () => ({
  addInteractionListener: jest.fn(),
  pauseInteractions: jest.fn(),
}));
jest.mock('../../doctor/web/WebSupportProjectPrerequisite');

let mockCapturedOnPress: (key: string) => Promise<any>;
jest.mock('../KeyPressHandler', () => ({
  KeyPressHandler: jest.fn().mockImplementation((onPress: any) => {
    mockCapturedOnPress = onPress;
    return {
      createInteractionListener: jest.fn(),
      startInterceptingKeyStrokes: jest.fn(),
    };
  }),
}));

function createMockDevServer() {
  return {
    isTargetingNative: jest.fn(() => true),
    openPlatformAsync: jest.fn(),
    openCustomRuntimeAsync: jest.fn(),
  };
}

function createMockDevServerManager(mockServer = createMockDevServer()) {
  return {
    projectRoot: '/test',
    options: { devClient: false },
    getDefaultDevServer: jest.fn(() => mockServer),
  } as any;
}

async function setup(
  options: Parameters<typeof startInterfaceAsync>[1],
  mockServer = createMockDevServer()
) {
  const devServerManager = createMockDevServerManager(mockServer);
  await startInterfaceAsync(devServerManager, options);
  return { onPress: mockCapturedOnPress!, mockServer, devServerManager };
}

afterEach(() => {
  jest.mocked(resolveLaunchPropsAsync).mockReset();
});

describe('startInterfaceAsync app-id handling', () => {
  it(`uses openCustomRuntimeAsync for Android when appId is set`, async () => {
    const mockLaunchProps = {
      packageName: 'com.example.app',
      mainActivity: '.MainActivity',
      launchActivity: 'com.custom.id/com.example.app.MainActivity',
      customAppId: 'com.custom.id',
    };
    jest.mocked(resolveLaunchPropsAsync).mockResolvedValue(mockLaunchProps);

    const { onPress, mockServer } = await setup({
      platforms: ['ios', 'android'],
      platformsOptions: { appId: 'com.custom.id' },
    });

    await onPress('a');

    expect(resolveLaunchPropsAsync).toHaveBeenCalledWith('/test', { appId: 'com.custom.id' });
    expect(mockServer.openCustomRuntimeAsync).toHaveBeenCalledWith(
      'emulator',
      {
        applicationId: 'com.example.app',
        customAppId: 'com.custom.id',
        launchActivity: 'com.custom.id/com.example.app.MainActivity',
      },
      { shouldPrompt: false }
    );
    expect(mockServer.openPlatformAsync).not.toHaveBeenCalled();
  });

  it(`uses openPlatformAsync for iOS when appId is set`, async () => {
    const { onPress, mockServer } = await setup({
      platforms: ['ios', 'android'],
      platformsOptions: { appId: 'com.custom.id' },
    });

    await onPress('i');

    expect(resolveLaunchPropsAsync).not.toHaveBeenCalled();
    expect(mockServer.openCustomRuntimeAsync).not.toHaveBeenCalled();
    expect(mockServer.openPlatformAsync).toHaveBeenCalledWith('simulator', {
      shouldPrompt: false,
    });
  });

  it(`uses openPlatformAsync for Android when appId is not set`, async () => {
    const { onPress, mockServer } = await setup({
      platforms: ['ios', 'android'],
    });

    await onPress('a');

    expect(resolveLaunchPropsAsync).not.toHaveBeenCalled();
    expect(mockServer.openCustomRuntimeAsync).not.toHaveBeenCalled();
    expect(mockServer.openPlatformAsync).toHaveBeenCalledWith('emulator', {
      shouldPrompt: false,
    });
  });

  it(`caches Android launch props across multiple presses`, async () => {
    const mockLaunchProps = {
      packageName: 'com.example.app',
      mainActivity: '.MainActivity',
      launchActivity: 'com.custom.id/com.example.app.MainActivity',
      customAppId: 'com.custom.id',
    };
    jest.mocked(resolveLaunchPropsAsync).mockResolvedValue(mockLaunchProps);

    const { onPress } = await setup({
      platforms: ['ios', 'android'],
      platformsOptions: { appId: 'com.custom.id' },
    });

    await onPress('a');
    await onPress('a');

    expect(resolveLaunchPropsAsync).toHaveBeenCalledTimes(1);
  });
});
