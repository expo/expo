import nock from 'nock';

import { Log } from '../../../log';
import { checkPackagesCompatibility, MAX_PACKAGES_PER_QUERY } from '../checkPackagesCompatibility';

jest.mock('../../../log');

describe(checkPackagesCompatibility, () => {
  it(`warns about one unsupported package`, async () => {
    nock('https://reactnative.directory')
      .get('/api/libraries/check')
      .query({ packages: 'react-native-code-push' })
      .reply(200, {
        'react-native-code-push': { newArchitecture: 'unsupported' },
      });

    await checkPackagesCompatibility(['react-native-code-push']);

    expect(Log.warn).toHaveBeenCalledTimes(1);
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringContaining('react-native-code-push does not support the New Architecture')
    );
  });

  it(`warns about multiple unsupported package`, async () => {
    nock('https://reactnative.directory')
      .get('/api/libraries/check')
      .query({
        packages: '@react-native-community/blur,@gorhom/bottom-sheet,react-native-code-push',
      })
      .reply(200, {
        '@react-native-community/blur': { newArchitecture: 'unsupported' },
        '@gorhom/bottom-sheet': { newArchitecture: 'unsupported' },
        'react-native-code-push': { newArchitecture: 'unsupported' },
      });

    await checkPackagesCompatibility([
      '@react-native-community/blur',
      '@gorhom/bottom-sheet',
      'react-native-code-push',
    ]);

    expect(Log.warn).toHaveBeenCalledTimes(1);
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        '@react-native-community/blur, @gorhom/bottom-sheet and react-native-code-push do not support the New Architecture'
      )
    );
  });

  it(`does not warn about supported or unknown package`, async () => {
    const request = nock('https://reactnative.directory')
      .get('/api/libraries/check')
      .query({ packages: 'expo-image,react-native-unknown-package' })
      .reply(200, {
        'expo-image': { newArchitecture: 'supported' },
        'react-native-unknown-package': { newArchitecture: undefined },
      });

    await checkPackagesCompatibility(['expo-image', 'react-native-unknown-package']);

    expect(request.isDone()).toBe(true);
    expect(Log.warn).toHaveBeenCalledTimes(0);
  });

  it(`does not fetch or warn when installing ignored packages`, async () => {
    let wasCalled = false;

    nock('https://reactnative.directory')
      .get('/api/libraries/check')
      .query({ packages: '@expo-google-fonts/inter,@expo/metro-runtime,@expo/styleguide' })
      .reply(200, () => {
        wasCalled = true;
        return {};
      });

    await checkPackagesCompatibility([
      '@expo-google-fonts/inter',
      '@expo/metro-runtime',
      '@expo/styleguide',
    ]);

    expect(wasCalled).toBe(false);
    expect(Log.warn).toHaveBeenCalledTimes(0);
  });

  it(`splits ${MAX_PACKAGES_PER_QUERY}+ packages into two requests`, async () => {
    const packages = Array.from(
      { length: MAX_PACKAGES_PER_QUERY + 1 },
      (_, index) => `react-native-package-${index + 1}`
    );
    const firstChunk = packages.slice(0, MAX_PACKAGES_PER_QUERY);
    const secondChunk = packages.slice(MAX_PACKAGES_PER_QUERY);

    const firstRequest = nock('https://reactnative.directory')
      .get('/api/libraries/check')
      .query({ packages: firstChunk.join(',') })
      .reply(
        200,
        Object.fromEntries(
          firstChunk.map((packageName) => [packageName, { newArchitecture: 'supported' }])
        )
      );

    const secondRequest = nock('https://reactnative.directory')
      .get('/api/libraries/check')
      .query({ packages: secondChunk.join(',') })
      .reply(
        200,
        Object.fromEntries(
          secondChunk.map((packageName) => [packageName, { newArchitecture: 'supported' }])
        )
      );

    await checkPackagesCompatibility(packages);

    expect(firstRequest.isDone()).toBe(true);
    expect(secondRequest.isDone()).toBe(true);
    expect(Log.warn).toHaveBeenCalledTimes(0);
  });
});
