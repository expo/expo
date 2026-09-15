import { vol } from 'memfs';

import rnFixture from '../../../../prebuild/__tests__/fixtures/react-native-project';
import { isSimulatorDevice } from '../resolveDevice';
import { resolveOptionsAsync } from '../resolveOptions';

jest.mock('../../../../utils/port');

jest.mock('../resolveDevice', () => ({
  isSimulatorDevice: jest.fn(() => true),
  resolveDeviceAsync: jest.fn(async () => ({
    name: 'mock',
    udid: '123',
  })),
}));

const fixture = {
  ...rnFixture,
  'package.json': JSON.stringify({}),
  'node_modules/expo/package.json': JSON.stringify({
    version: '53.0.0',
  }),
};

describe(resolveOptionsAsync, () => {
  afterEach(() => vol.reset());

  it(`resolves default options`, async () => {
    vol.fromJSON(fixture, '/');

    expect(await resolveOptionsAsync('/', {})).toEqual({
      buildCache: true,
      configuration: 'Debug',
      device: { name: 'mock', udid: '123' },
      isSimulator: true,
      osType: 'iOS',
      port: 8081,
      projectRoot: '/',
      scheme: 'ReactNativeProject',
      shouldSkipInitialBundling: false,
      shouldStartBundler: true,
      xcodeProject: { isWorkspace: false, name: '/ios/ReactNativeProject.xcodeproj' },
    });
  });
  it(`resolves complex options`, async () => {
    vol.fromJSON(fixture, '/');

    jest.mocked(isSimulatorDevice).mockImplementationOnce(() => false);

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
      osType: 'iOS',
      port: 8081,
      projectRoot: '/',
      scheme: 'MyScheme',
      shouldSkipInitialBundling: false,
      shouldStartBundler: true,
      xcodeProject: { isWorkspace: false, name: '/ios/ReactNativeProject.xcodeproj' },
    });
  });

  describe.each([
    { target: 'simulator', isSimulator: true },
    { target: 'device', isSimulator: false },
  ])('on a $target', ({ isSimulator }) => {
    it.each(['Debug', 'DebugStaging', 'debugStaging'])(
      'respects --no-bundler without forcing SKIP_BUNDLING for %s',
      async (configuration) => {
        vol.fromJSON(fixture, '/');
        jest.mocked(isSimulatorDevice).mockReturnValueOnce(isSimulator);

        expect(await resolveOptionsAsync('/', { bundler: false, configuration })).toEqual(
          expect.objectContaining({
            configuration,
            shouldSkipInitialBundling: configuration === 'Debug' && !isSimulator,
            shouldStartBundler: false,
          })
        );
      }
    );
  });

  it('respects --no-bundler without an explicit configuration', async () => {
    vol.fromJSON(fixture, '/');

    expect(await resolveOptionsAsync('/', { bundler: false })).toEqual(
      expect.objectContaining({ shouldStartBundler: false })
    );
  });

  it('defaults to Debug even when an explicit scheme has a Release Run configuration', async () => {
    vol.fromJSON(
      {
        ...fixture,
        'ios/ReactNativeProject.xcodeproj/xcshareddata/xcschemes/Client.xcscheme': `
          <Scheme version="1.3">
            <LaunchAction buildConfiguration="Release">
              <BuildableProductRunnable>
                <BuildableReference BlueprintIdentifier="13B07F861A680F5B00A75B9A"
                  BlueprintName="ReactNativeProject" BuildableName="ReactNativeProject.app"
                  ReferencedContainer="container:ReactNativeProject.xcodeproj" />
              </BuildableProductRunnable>
            </LaunchAction>
          </Scheme>`,
      },
      '/'
    );

    expect(await resolveOptionsAsync('/', { scheme: 'Client' })).toEqual(
      expect.objectContaining({ scheme: 'Client', configuration: 'Debug' })
    );
  });
});
