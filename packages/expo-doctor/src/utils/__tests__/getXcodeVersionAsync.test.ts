import spawnAsync from '@expo/spawn-async';

import { getXcodeVersionAsync } from '../getXcodeVersionAsync';

jest.mock('@expo/spawn-async');

function mockXcodeInstalled(version: string) {
  return jest.mocked(spawnAsync).mockResolvedValueOnce({
    stdout: `Xcode ${version}
Build version 16B40`,
    stderr: '',
    output: ['', `Xcode ${version}\n  Build version 16B40`, ''],
    status: 0,
    signal: null,
  });
}

describe(getXcodeVersionAsync, () => {
  it('returns the version of xcode installed in semantic format', async () => {
    mockXcodeInstalled('16.1');
    const result = await getXcodeVersionAsync();
    expect(result.xcodeVersion).toBe('16.1.0');
  });

  it('handles versions with three parts correctly', async () => {
    mockXcodeInstalled('16.1.1');
    const result = await getXcodeVersionAsync();
    expect(result.xcodeVersion).toBe('16.1.1');
  });

  it('returns null if xcode is not installed', async () => {
    jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('Xcode not installed'));
    const result = await getXcodeVersionAsync();
    expect(result.xcodeVersion).toBeNull();
  });
});
