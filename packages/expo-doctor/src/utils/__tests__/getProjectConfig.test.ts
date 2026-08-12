import { getProjectConfigAsync } from '../getProjectConfig';
import { spawnExpoCLI } from '../spawnExpoCLI';

jest.mock('../spawnExpoCLI');
const mockSpawnExpoCLI = spawnExpoCLI as jest.MockedFunction<typeof spawnExpoCLI>;

describe(getProjectConfigAsync, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid JSON output from expo config', async () => {
    const configOutput = {
      exp: { name: 'test-app', slug: 'test-app', sdkVersion: '52.0.0' },
      pkg: { name: 'test-app', dependencies: {} },
      hasUnusedStaticConfig: false,
      staticConfigPath: '/project/app.json',
      dynamicConfigPath: null,
    };

    mockSpawnExpoCLI.mockResolvedValue({
      stdout: JSON.stringify(configOutput),
      stderr: '',
      status: 0,
      signal: null,
      output: [JSON.stringify(configOutput), ''],
      pid: 1234,
    });

    const result = await getProjectConfigAsync('/project', 'production');

    expect(result).toEqual({
      exp: configOutput.exp,
      pkg: configOutput.pkg,
      hasUnusedStaticConfig: false,
      staticConfigPath: '/project/app.json',
      dynamicConfigPath: null,
    });

    expect(mockSpawnExpoCLI).toHaveBeenCalledWith('/project', ['config', '--json', '--full'], {
      stdio: 'pipe',
      env: { EXPO_CONFIG_MODE: 'production', EXPO_DEBUG: '0' },
    });
  });

  it('throws on invalid JSON output', async () => {
    mockSpawnExpoCLI.mockResolvedValue({
      stdout: 'not json',
      stderr: '',
      status: 0,
      signal: null,
      output: ['not json', ''],
      pid: 1234,
    });

    await expect(getProjectConfigAsync('/project', 'development')).rejects.toThrow(
      /Failed to parse JSON output/
    );
  });

  it('throws when exp or pkg fields are missing', async () => {
    mockSpawnExpoCLI.mockResolvedValue({
      stdout: JSON.stringify({ something: 'else' }),
      stderr: '',
      status: 0,
      signal: null,
      output: ['{}', ''],
      pid: 1234,
    });

    await expect(getProjectConfigAsync('/project', 'development')).rejects.toThrow(
      /missing 'exp' or 'pkg' fields/
    );
  });

  it('defaults hasUnusedStaticConfig, staticConfigPath, dynamicConfigPath when absent', async () => {
    const configOutput = {
      exp: { name: 'test-app', slug: 'test-app', sdkVersion: '52.0.0' },
      pkg: { name: 'test-app' },
    };

    mockSpawnExpoCLI.mockResolvedValue({
      stdout: JSON.stringify(configOutput),
      stderr: '',
      status: 0,
      signal: null,
      output: [JSON.stringify(configOutput), ''],
      pid: 1234,
    });

    const result = await getProjectConfigAsync('/project', 'development');

    expect(result.hasUnusedStaticConfig).toBe(false);
    expect(result.staticConfigPath).toBeNull();
    expect(result.dynamicConfigPath).toBeNull();
  });

  it('throws when exp.sdkVersion is missing', async () => {
    mockSpawnExpoCLI.mockResolvedValue({
      stdout: JSON.stringify({
        exp: { name: 'test-app', slug: 'test-app' },
        pkg: { name: 'test-app' },
      }),
      stderr: '',
      status: 0,
      signal: null,
      output: ['{}', ''],
      pid: 1234,
    });

    await expect(getProjectConfigAsync('/project', 'development')).rejects.toThrow(
      /Cannot determine the project's Expo SDK version/
    );
  });
});
