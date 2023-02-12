import { resolveMetroVersionFromProject } from '../../../start/server/metro/resolveFromProject';
import { getMetroProperties } from '../getMetroProperties';

jest.mock('../../../start/server/metro/resolveFromProject');

describe(getMetroProperties, () => {
  it('works with empty object', () => {
    jest.mocked(resolveMetroVersionFromProject).mockReturnValue('1.33.7');

    const { sdkVersion, metroVersion, ...properties } = getMetroProperties(
      '/fake-project',
      { sdkVersion: '47.0.0' } as any,
      {}
    );

    expect(sdkVersion).toBe('47.0.0');
    expect(metroVersion).toBe('1.33.7');
    expect(Object.keys(properties).length).toBeGreaterThan(0);
    expect(Object.values(properties).every((value) => value === undefined)).toBe(true);
  });
});
