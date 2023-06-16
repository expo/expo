import { vol } from 'memfs';

import rnFixture from '../../../../prebuild/__tests__/fixtures/react-native-project';
import { isSimulatorDevice } from '../resolveDevice';
import { resolveOptionsAsync } from '../resolveOptions';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../../../utils/port');

jest.mock('../resolveDevice', () => ({
  isSimulatorDevice: jest.fn(() => true),
  resolveDeviceAsync: jest.fn(async () => ({
    name: 'mock',
    udid: '123',
  })),
}));

describe(resolveOptionsAsync, () => {
  afterEach(() => vol.reset());

  it(`resolves default options`, async () => {
    vol.fromJSON(rnFixture, '/');

    expect(await resolveOptionsAsync('/', {})).toEqual({
      buildCache: true,
      configuration: 'Debug',
      device: { name: 'mock', udid: '123' },
      isSimulator: true,
      port: 8081,
      projectRoot: '/',
      scheme: 'ReactNativeProject',
      shouldSkipInitialBundling: false,
      shouldStartBundler: true,
      xcodeProject: { isWorkspace: false, name: '/ios/ReactNativeProject.xcodeproj' },
    });
  });
  it(`resolves complex options`, async () => {
    vol.fromJSON(rnFixture, '/');

    asMock(isSimulatorDevice).mockImplementationOnce(() => false);

    expect(
      await resolveOptionsAsync('/', {
        buildCache: false,
        bundler: true,
        device: 'search',
        install: true,
        port: 8081,
        configuration: 'Release',
        scheme: 'MyScheme',
      })
    ).toEqual({
      buildCache: false,
      configuration: 'Release',
      device: { name: 'mock', udid: '123' },
      isSimulator: false,
      port: 8081,
      projectRoot: '/',
      scheme: 'MyScheme',
      shouldSkipInitialBundling: false,
      shouldStartBundler: true,
      xcodeProject: { isWorkspace: false, name: '/ios/ReactNativeProject.xcodeproj' },
    });
  });
});
