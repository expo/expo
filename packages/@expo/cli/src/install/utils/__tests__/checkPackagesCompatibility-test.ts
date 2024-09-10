import { Log } from '../../../log';
import { fetch } from '../../../utils/fetch';
import { checkPackagesCompatibility } from '../checkPackagesCompatibility';

jest.mock('../../../log');
jest.mock('../../../utils/fetch');

describe(checkPackagesCompatibility, () => {
  it(`warns about one unsupported package`, async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          'react-native-auth0': { newArchitecture: 'unsupported' },
        }),
    } as any);

    await checkPackagesCompatibility(['react-native-code-push']);

    expect(Log.warn).toBeCalledTimes(1);
    expect(Log.warn).toHaveBeenLastCalledWith(
      expect.stringMatching(/react-native-code-push do not support the New Architecture/)
    );
  });

  it(`warns about multiple unsupported package`, async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          '@react-native-community/blur': { newArchitecture: 'unsupported' },
          '@gorhom/bottom-sheet': { newArchitecture: 'unsupported' },
          'react-native-auth0': { newArchitecture: 'unsupported' },
        }),
    } as any);

    await checkPackagesCompatibility([
      '@react-native-community/blur',
      '@gorhom/bottom-sheet',
      'react-native-code-push',
    ]);

    expect(Log.warn).toBeCalledTimes(1);
    expect(Log.warn).toHaveBeenLastCalledWith(
      expect.stringMatching(
        /@react-native-community\/blur, @gorhom\/bottom-sheet and react-native-code-push do not support the New Architecture/
      )
    );
  });

  it(`does not warn about supported or unknown package`, async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          'expo-image': { newArchitecture: 'supported' },
          'expo-image-picker': { newArchitecture: undefined },
        }),
    } as any);

    await checkPackagesCompatibility(['expo-image']);

    expect(Log.warn).toBeCalledTimes(0);
  });
});
