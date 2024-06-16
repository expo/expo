import { getMetroProperties } from '../getMetroProperties';

describe(getMetroProperties, () => {
  it('works with empty object', () => {
    const { sdkVersion, metroVersion, ...properties } = getMetroProperties(
      '/fake-project',
      { sdkVersion: '47.0.0' } as any,
      {}
    );

    expect(sdkVersion).toBe('47.0.0');
    expect(metroVersion).toMatch(/^\d+\.\d+\.\d+$/);

    expect(Object.keys(properties).length).toBeGreaterThan(0);
    expect(Object.values(properties).every((value) => value === undefined)).toBe(true);
  });
});
