import { withGradleProperties } from 'expo/config-plugins';

import { compileMockModWithResultsAsync } from './mockMods';
import { withAndroidGradleEdgeToEdgeProperty } from '../withAndroidGradleEdgeToEdgeProperty';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withGradleProperties: jest.fn(),
  };
});

describe(withAndroidGradleEdgeToEdgeProperty, () => {
  it(`adds enableEdgeToEdge property when edgeToEdge is enabled`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { experiments: { edgeToEdge: true } },
      {
        plugin: withAndroidGradleEdgeToEdgeProperty,
        mod: withGradleProperties,
        modResults: [] as any[],
      }
    );

    expect(modResults).toStrictEqual([
      { type: 'comment', value: 'Enable edge-to-edge' },
      { key: 'edgeToEdgeEnabled', type: 'property', value: 'true' },
    ]);
  });

  it(`updates enableEdgeToEdge property when edgeToEdge is disabled`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { experiments: { edgeToEdge: false } },
      {
        plugin: withAndroidGradleEdgeToEdgeProperty,
        mod: withGradleProperties,
        modResults: [
          { type: 'comment', value: 'Enable edge-to-edge' },
          { key: 'edgeToEdgeEnabled', type: 'property', value: 'true' },
        ],
      }
    );

    expect(modResults).toStrictEqual([
      { type: 'comment', value: 'Enable edge-to-edge' },
      { key: 'edgeToEdgeEnabled', type: 'property', value: 'false' },
    ]);
  });
});
