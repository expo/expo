import { Platform } from 'expo-modules-core';

import { flattenPlatformOptions } from '../options';

jest.mock('expo-modules-core', () => ({
  Platform: {
    OS: 'android',
  },
}));

describe('flattenPlatformOptions', () => {
  it('flattens android options on Android', () => {
    (Platform as any).OS = 'android';

    const options = {
      inputFormat: 'plainText',
      android: {
        isSensitive: true,
      },
    };

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({
      inputFormat: 'plainText',
      isSensitive: true,
    });
    expect(result).not.toHaveProperty('android');
  });

  it('does not flatten android options on iOS', () => {
    (Platform as any).OS = 'ios';

    const options = {
      inputFormat: 'plainText',
      android: {
        isSensitive: true,
      },
    };

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({
      inputFormat: 'plainText',
    });
    expect(result).not.toHaveProperty('android');
    expect(result).not.toHaveProperty('isSensitive');
  });

  it('flattens ios options on iOS', () => {
    (Platform as any).OS = 'ios';

    const options = {
      inputFormat: 'plainText',
      ios: {
        localOnly: true,
      },
    };

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({
      inputFormat: 'plainText',
      localOnly: true,
    });
    expect(result).not.toHaveProperty('ios');
  });

  it('does not flatten ios options on Android', () => {
    (Platform as any).OS = 'android';

    const options = {
      inputFormat: 'plainText',
      ios: {
        localOnly: true,
      },
    };

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({
      inputFormat: 'plainText',
    });
    expect(result).not.toHaveProperty('ios');
    expect(result).not.toHaveProperty('localOnly');
  });

  it('flattens web options on web', () => {
    (Platform as any).OS = 'web';

    const options = {
      inputFormat: 'plainText',
      web: {
        useClipboardAPI: true,
      },
    };

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({
      inputFormat: 'plainText',
      useClipboardAPI: true,
    });
    expect(result).not.toHaveProperty('web');
  });

  it('handles empty options', () => {
    (Platform as any).OS = 'android';

    const options = {};

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({});
  });

  it('handles multiple platform options, only flattens current platform', () => {
    (Platform as any).OS = 'android';

    const options = {
      inputFormat: 'plainText',
      android: {
        isSensitive: true,
      },
      ios: {
        localOnly: true,
      },
      web: {
        useClipboardAPI: true,
      },
    };

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({
      inputFormat: 'plainText',
      isSensitive: true,
    });
    expect(result).not.toHaveProperty('android');
    expect(result).not.toHaveProperty('ios');
    expect(result).not.toHaveProperty('web');
    expect(result).not.toHaveProperty('localOnly');
    expect(result).not.toHaveProperty('useClipboardAPI');
  });

  it('handles undefined platform options', () => {
    (Platform as any).OS = 'android';

    const options = {
      inputFormat: 'plainText',
      android: undefined,
    };

    const result = flattenPlatformOptions(options);

    expect(result).toEqual({
      inputFormat: 'plainText',
    });
    expect(result).not.toHaveProperty('android');
  });
});
