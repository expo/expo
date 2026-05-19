import { vol } from 'memfs';

import { fetch } from '../../../../utils/fetch';
import {
  correctReactNativeTvVersion,
  isReactNativeTvProjectAsync,
  reactNativeTvVersionMatchesBundled,
} from '../reactNativeTv';

jest.mock('../../../../utils/fetch', () => ({
  fetch: jest.fn(),
}));

const mockedFetch = jest.mocked(fetch);

const okJsonResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as any;

const errorResponse = (status: number, body: string = '') =>
  ({
    ok: false,
    status,
    text: () => Promise.resolve(body),
  }) as any;

describe(isReactNativeTvProjectAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    mockedFetch.mockReset();
  });

  it('returns true when node_modules/react-native/package.json has name "react-native-tvos"', async () => {
    vol.fromJSON(
      {
        'node_modules/react-native/package.json': JSON.stringify({
          name: 'react-native-tvos',
          version: '0.83.6-0',
        }),
      },
      projectRoot
    );

    await expect(isReactNativeTvProjectAsync(projectRoot)).resolves.toBe(true);
  });

  it('returns false when the installed react-native is the upstream package', async () => {
    vol.fromJSON(
      {
        'node_modules/react-native/package.json': JSON.stringify({
          name: 'react-native',
          version: '0.85.3',
        }),
      },
      projectRoot
    );

    await expect(isReactNativeTvProjectAsync(projectRoot)).resolves.toBe(false);
  });

  it('returns false when react-native is not installed at all', async () => {
    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({ version: '55.0.0' }),
      },
      projectRoot
    );

    await expect(isReactNativeTvProjectAsync(projectRoot)).resolves.toBe(false);
  });

  it('returns false when react-native package.json has no name field', async () => {
    vol.fromJSON(
      {
        'node_modules/react-native/package.json': JSON.stringify({ version: '0.85.3' }),
      },
      projectRoot
    );

    await expect(isReactNativeTvProjectAsync(projectRoot)).resolves.toBe(false);
  });
});

describe(correctReactNativeTvVersion, () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.EXPO_OFFLINE;
  });

  it('returns the derived stable dist-tag when published on npm', async () => {
    mockedFetch.mockResolvedValueOnce(
      okJsonResponse({ latest: '0.85.3-0', '0.85-stable': '0.85.3-0' })
    );

    await expect(correctReactNativeTvVersion('0.85.3')).resolves.toBe(
      'npm:react-native-tvos@0.85-stable'
    );
  });

  it('returns the `next` dist-tag for prerelease react-native versions', async () => {
    mockedFetch.mockResolvedValueOnce(okJsonResponse({ latest: '0.85.3-0', next: '0.86.0-rc.1' }));
    await expect(correctReactNativeTvVersion('0.85.3-rc.1')).resolves.toBe(
      'npm:react-native-tvos@next'
    );

    mockedFetch.mockResolvedValueOnce(okJsonResponse({ latest: '0.85.3-0', next: '0.86.0-rc.1' }));
    await expect(correctReactNativeTvVersion('0.86.0-canary.20260514-abc1234')).resolves.toBe(
      'npm:react-native-tvos@next'
    );
  });

  it('handles caret-prefixed stable react-native versions', async () => {
    mockedFetch.mockResolvedValueOnce(
      okJsonResponse({ latest: '0.85.3-0', '0.85-stable': '0.85.3-0' })
    );

    await expect(correctReactNativeTvVersion('^0.85.3')).resolves.toBe(
      'npm:react-native-tvos@0.85-stable'
    );
  });

  it('treats a caret range whose minimum is a prerelease as @next', async () => {
    mockedFetch.mockResolvedValueOnce(okJsonResponse({ latest: '0.85.3-0', next: '0.86.0-rc.1' }));

    await expect(correctReactNativeTvVersion('^0.85.3-rc.1')).resolves.toBe(
      'npm:react-native-tvos@next'
    );
  });

  it('falls back to @latest when the derived dist-tag is not published', async () => {
    // Future SDK whose minor line doesn't have a `-stable` tag published yet.
    mockedFetch.mockResolvedValueOnce(
      okJsonResponse({ latest: '0.85.3-0', '0.85-stable': '0.85.3-0' })
    );

    await expect(correctReactNativeTvVersion('0.99.0')).resolves.toBe(
      'npm:react-native-tvos@latest'
    );
  });

  it('falls back to @latest when no dist-tags can be fetched (network failure)', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('connection refused'));

    await expect(correctReactNativeTvVersion('0.85.3')).resolves.toBe(
      'npm:react-native-tvos@latest'
    );
  });

  it('falls back to @latest when the npm registry returns a non-2xx', async () => {
    mockedFetch.mockResolvedValueOnce(errorResponse(500, 'oops'));

    await expect(correctReactNativeTvVersion('0.85.3')).resolves.toBe(
      'npm:react-native-tvos@latest'
    );
  });

  it('falls back to @latest when the response body is not valid JSON', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('not json'),
    } as any);

    await expect(correctReactNativeTvVersion('0.85.3')).resolves.toBe(
      'npm:react-native-tvos@latest'
    );
  });

  it('falls back to @latest for unparseable react-native versions', async () => {
    await expect(correctReactNativeTvVersion('not-a-version')).resolves.toBe(
      'npm:react-native-tvos@latest'
    );
    await expect(correctReactNativeTvVersion('')).resolves.toBe('npm:react-native-tvos@latest');
    // The offline short-circuit (and unparseable handling) shouldn't hit the
    // registry at all.
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('skips the npm dist-tags lookup when EXPO_OFFLINE is set', async () => {
    process.env.EXPO_OFFLINE = '1';

    await expect(correctReactNativeTvVersion('0.85.3')).resolves.toBe(
      'npm:react-native-tvos@0.85-stable'
    );
    await expect(correctReactNativeTvVersion('0.85.3-rc.1')).resolves.toBe(
      'npm:react-native-tvos@next'
    );
    // Asserting the network was untouched is the whole point of the offline
    // short-circuit — keep this explicit.
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('still falls back to @latest in offline mode when the version is unparseable', async () => {
    process.env.EXPO_OFFLINE = '1';

    await expect(correctReactNativeTvVersion('not-a-version')).resolves.toBe(
      'npm:react-native-tvos@latest'
    );
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});

describe(reactNativeTvVersionMatchesBundled, () => {
  it('returns true when installed and bundled share major.minor', () => {
    expect(reactNativeTvVersionMatchesBundled('0.85.3-0', '0.85.3')).toBe(true);
    expect(reactNativeTvVersionMatchesBundled('0.85.0-0', '0.85.3')).toBe(true);
    expect(reactNativeTvVersionMatchesBundled('0.85.7-rc.4', '0.85.3')).toBe(true);
  });

  it('returns false when minors differ', () => {
    expect(reactNativeTvVersionMatchesBundled('0.83.0-0', '0.85.3')).toBe(false);
  });

  it('returns false when majors differ', () => {
    expect(reactNativeTvVersionMatchesBundled('1.85.0', '0.85.3')).toBe(false);
  });

  it('returns false for unparseable inputs', () => {
    expect(reactNativeTvVersionMatchesBundled('not-a-version', '0.85.3')).toBe(false);
    expect(reactNativeTvVersionMatchesBundled('0.85.3-0', 'not-a-version')).toBe(false);
  });
});
