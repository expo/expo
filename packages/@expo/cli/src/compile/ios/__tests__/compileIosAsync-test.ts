import { Log } from '../../../log';
import { copyBinaryToOutputAsync } from '../../copyBinaryToOutputAsync';
import { debugEvent, event } from '../../events';
import type { ResolvedOptions } from '../../resolveOptions';
import { compileIosAsync } from '../compileIosAsync';
import type { BuildProps } from '../resolveOptions';
import { resolveOptionsAsync } from '../resolveOptions';
import { buildAsync, getAppPathAsync } from '../xcodebuild';

jest.mock('../../../log');
jest.mock('../../copyBinaryToOutputAsync');
jest.mock('../resolveOptions');
jest.mock('../xcodebuild');
jest.mock('../../events', () => {
  const done = jest.fn();
  return {
    event: Object.assign(jest.fn(), {
      span: jest.fn(() => done),
      error: jest.fn((error) => error),
      path: jest.fn((path) => path),
    }),
    debugEvent: Object.assign(jest.fn(), {
      path: jest.fn((path) => path),
    }),
  };
});

const mockPlatform = (value: typeof process.platform) =>
  Object.defineProperty(process, 'platform', {
    value,
  });

const platform = process.platform;

afterEach(() => {
  mockPlatform(platform);
});

const options: ResolvedOptions = { mode: 'development', outputType: 'app' };

const props: BuildProps = {
  ...options,
  configuration: 'Debug',
  xcodeProject: { name: '/app/ios/app.xcworkspace', isWorkspace: true },
  scheme: 'app',
  osType: 'iOS',
};

describe(compileIosAsync, () => {
  it(`asserts that the function only runs on darwin machines`, async () => {
    mockPlatform('win32');
    await expect(compileIosAsync('/app', options)).rejects.toThrow(/EXIT_CALLED/);
    expect(Log.exit).toHaveBeenCalledWith(expect.stringMatching(/eas build -p ios/));
    expect(resolveOptionsAsync).not.toHaveBeenCalled();
  });

  it(`builds the app`, async () => {
    mockPlatform('darwin');
    jest.mocked(resolveOptionsAsync).mockResolvedValueOnce(props);
    jest.mocked(getAppPathAsync).mockResolvedValueOnce('/DerivedData/app.app');
    await compileIosAsync('/app', options);
    expect(resolveOptionsAsync).toHaveBeenCalledWith('/app', options);
    expect(buildAsync).toHaveBeenCalledWith(props);
    expect(debugEvent).toHaveBeenCalledWith('ios:build_props', {
      scheme: 'app',
      configuration: 'Debug',
      osType: 'iOS',
      xcodeProject: '/app/ios/app.xcworkspace',
    });
    const done = jest.mocked(event.span).mock.results[0]?.value;
    expect(done).toHaveBeenCalledWith('build:done', { platform: 'ios', mode: 'development' });
    expect(done).toHaveBeenCalledWith('done', {
      platform: 'ios',
      mode: 'development',
      outputType: 'app',
      outputPath: '/DerivedData/app.app',
    });
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Build complete'));
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Binary: /DerivedData/app.app'));
  });

  it(`copies the app to the output directory`, async () => {
    mockPlatform('darwin');
    jest.mocked(resolveOptionsAsync).mockResolvedValueOnce({ ...props, outputDir: '/app/build' });
    jest.mocked(getAppPathAsync).mockResolvedValueOnce('/DerivedData/app.app');
    jest.mocked(copyBinaryToOutputAsync).mockResolvedValueOnce('/app/build/app.app');
    await compileIosAsync('/app', options);
    expect(copyBinaryToOutputAsync).toHaveBeenCalledWith('/DerivedData/app.app', '/app/build');
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Binary: /app/build/app.app'));
    expect(jest.mocked(event.span).mock.results[0]?.value).toHaveBeenCalledWith(
      'done',
      expect.objectContaining({ outputPath: '/app/build/app.app' })
    );
  });

  it(`reports a failed build`, async () => {
    mockPlatform('darwin');
    jest.mocked(resolveOptionsAsync).mockResolvedValueOnce(props);
    const error = new Error('build failed');
    jest.mocked(buildAsync).mockRejectedValueOnce(error);
    await expect(compileIosAsync('/app', options)).rejects.toBe(error);
    expect(event).toHaveBeenCalledWith('build:failed', { platform: 'ios', error });
  });
});
