import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { SimulatorLogStreamer } from '../../../start/platforms/ios/simctlLogging';
import { DevServerManager } from '../../../start/server/DevServerManager';
import { getAppDeltaDirectory, installOnDeviceAsync } from '../appleDevice/installOnDeviceAsync';
import { launchAppAsync } from '../launchApp';

jest.mock('../../../log');

jest.mock('../../../utils/env', () => ({
  env: {
    CI: false,
  },
}));

jest.mock('../../../start/platforms/ios/AppleDeviceManager', () => ({
  AppleDeviceManager: {
    resolveAsync: async () => ({
      installAppAsync: jest.fn(),
      device: {},
    }),
  },
}));

jest.mock('../../../start/platforms/ios/simctlLogging', () => ({
  SimulatorLogStreamer: {
    getStreamer: jest.fn(() => ({ attachAsync: jest.fn() })),
  },
}));

jest.mock('../appleDevice/installOnDeviceAsync', () => ({
  getAppDeltaDirectory: jest.fn(() => '/mock_delta'),
  installOnDeviceAsync: jest.fn(async () => ''),
}));

const mockPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
  <key>CFBundleIdentifier</key>
  <string>dev.bacon.myapp</string>
  </dict>
</plist>`;

function getMockDevServerManager() {
  return {
    startAsync: jest.fn(),
    getDefaultDevServer: jest.fn(() => ({
      openCustomRuntimeAsync: jest.fn(),
    })),
  } as unknown as DevServerManager;
}

describe(launchAppAsync, () => {
  afterEach(() => vol.reset());

  it(`runs ios on simulator`, async () => {
    vol.fromJSON({ ...rnFixture, '/path/to/app.ipa/Info.plist': mockPlist }, '/');

    await launchAppAsync('/path/to/app.ipa', getMockDevServerManager(), {
      device: {
        name: 'simulator',
        udid: '123',
      },
      isSimulator: true,
      shouldStartBundler: true,
    });

    expect(SimulatorLogStreamer.getStreamer).toBeCalled();

    expect(installOnDeviceAsync).not.toBeCalled();
    expect(getAppDeltaDirectory).not.toBeCalled();
  });
  it(`does not streams logs on simulator if the dev server is skipped`, async () => {
    vol.fromJSON({ ...rnFixture, '/path/to/app.ipa/Info.plist': mockPlist }, '/');
    await launchAppAsync('/path/to/app.ipa', getMockDevServerManager(), {
      device: {
        name: 'simulator',
        udid: '123',
      },
      isSimulator: true,
      shouldStartBundler: false,
    });

    expect(SimulatorLogStreamer.getStreamer).not.toBeCalled();
    expect(installOnDeviceAsync).not.toBeCalled();
    expect(getAppDeltaDirectory).not.toBeCalled();
  });

  it(`runs ios on device`, async () => {
    vol.fromJSON({ ...rnFixture, '/path/to/app.ipa/Info.plist': mockPlist }, '/');

    await launchAppAsync('/path/to/app.ipa', getMockDevServerManager(), {
      device: {
        name: "Evan's phone",
        udid: '00008101-001964A22629003A',
      },
      isSimulator: false,
      shouldStartBundler: true,
    });

    expect(SimulatorLogStreamer.getStreamer).not.toBeCalled();

    expect(installOnDeviceAsync).toBeCalled();
    expect(getAppDeltaDirectory).toBeCalled();
  });
});
