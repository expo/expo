import { Log } from '../../../log';
import type { ResolvedOptions } from '../../resolveOptions';
import { compileIosAsync } from '../compileIosAsync';
import type { BuildProps } from '../resolveOptions';
import { resolveOptionsAsync } from '../resolveOptions';
import { buildAsync } from '../xcodebuild';

jest.mock('../../../log');
jest.mock('../resolveOptions');
jest.mock('../xcodebuild');

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
    await compileIosAsync('/app', options);
    expect(resolveOptionsAsync).toHaveBeenCalledWith('/app', options);
    expect(buildAsync).toHaveBeenCalledWith(props);
  });
});
