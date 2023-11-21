import spawnAsync from '@expo/spawn-async';

import { asMock } from '../../__tests__/asMock';
import { getDeepDependenciesWarningAsync } from '../explainDependencies';
import mockNpmExplain from './fixtures/npm-explain.json';

const mockNpmExplainJsonString = JSON.stringify(mockNpmExplain);

describe(getDeepDependenciesWarningAsync, () => {
  it(`returns null if package found with correct version`, async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      stdout: mockNpmExplainJsonString,
      stderr: '',
      status: 0,
    } as any);
    const result = await getDeepDependenciesWarningAsync(
      { name: '@expo/prebuild-config', version: '5.0.7' },
      '../'
    );
    expect(result).toBe(null);
  });

  it(`returns warning if package found with incorrect version`, async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      stdout: mockNpmExplainJsonString,
      stderr: '',
      status: 0,
    } as any);
    const result = await getDeepDependenciesWarningAsync(
      { name: '@expo/prebuild-config', version: '5.0.6' },
      '../'
    );
    expect(result).toContain('Expected package');
  });

  it(`returns null if illegal package not found`, async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      stdout: mockNpmExplainJsonString,
      stderr: '',
      status: 0,
    } as any);
    const result = await getDeepDependenciesWarningAsync(
      /* don't pass version to check for packages that shouldn't be there */
      { name: '@expo/fictional-package' },
      '../'
    );
    expect(result).toBe(null);
  });

  it(`returns warning if illegal package found`, async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      stdout: mockNpmExplainJsonString,
      stderr: '',
      status: 0,
    } as any);
    /* don't pass version to check for packages that shouldn't be there */
    const result = await getDeepDependenciesWarningAsync({ name: '@expo/prebuild-config' }, '../');
    expect(result).toContain('Expected to not find any copies');
  });
});
