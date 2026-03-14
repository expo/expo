import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import {
  getExpoFontPluginProps,
  getEmbeddedFontBasenames,
  filterEmbeddedFontsFromAssets,
} from '../filterEmbeddedFontAssets';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(),
}));

afterEach(() => vol.reset());

describe(getExpoFontPluginProps, () => {
  it('returns null when expo-font is absent or has no props', () => {
    expect(getExpoFontPluginProps(undefined)).toBeNull();
    expect(getExpoFontPluginProps([])).toBeNull();
    expect(getExpoFontPluginProps(['expo-font'])).toBeNull();
    expect(getExpoFontPluginProps(['expo-camera', ['expo-image', {}]])).toBeNull();
  });

  it('returns props from expo-font tuple', () => {
    const props = { fonts: ['./fonts/Inter.ttf'], ios: { fonts: ['./fonts/SF.ttf'] } };
    expect(getExpoFontPluginProps([['expo-font', props]])).toEqual(props);
  });
});

describe(getEmbeddedFontBasenames, () => {
  it('resolves files, directories, and Android FontObjects', () => {
    vol.fromJSON(
      {
        'fonts/Inter.ttf': '',
        'fonts/dir/Roboto.otf': '',
        'fonts/dir/README.md': '',
        'fonts/Bold.ttf': '',
      },
      '/project'
    );

    const plugins = [
      [
        'expo-font',
        {
          fonts: ['./fonts/dir'],
          android: {
            fonts: [
              {
                fontFamily: 'Inter',
                fontDefinitions: [{ path: './fonts/Inter.ttf', weight: 400 }],
              },
            ],
          },
          ios: { fonts: ['./fonts/Bold.ttf'] },
        },
      ],
    ];

    const android = getEmbeddedFontBasenames('/project', 'android', plugins);
    expect(android).toEqual(new Set(['Roboto.otf', 'Inter.ttf']));

    const ios = getEmbeddedFontBasenames('/project', 'ios', plugins);
    expect(ios).toEqual(new Set(['Roboto.otf', 'Bold.ttf']));
  });

  it('skips non-existent paths gracefully', () => {
    vol.fromJSON({ 'fonts/A.ttf': '' }, '/project');
    const result = getEmbeddedFontBasenames('/project', 'ios', [
      ['expo-font', { fonts: ['./fonts/A.ttf', './fonts/Missing.ttf'] }],
    ]);
    expect(result).toEqual(new Set(['A.ttf']));
  });
});

function makeAsset(name: string, type: string): any {
  return { name, type, scales: [1], hash: 'abc', fileHashes: ['abc'] };
}

describe(filterEmbeddedFontsFromAssets, () => {
  it('is a no-op for web/null platform and when getConfig throws', () => {
    const assets = [makeAsset('X', 'ttf')];
    expect(filterEmbeddedFontsFromAssets(assets, '/p', 'web')).toBe(assets);
    expect(filterEmbeddedFontsFromAssets(assets, '/p', null)).toBe(assets);

    jest.mocked(getConfig).mockImplementation(() => {
      throw new Error('boom');
    });
    expect(filterEmbeddedFontsFromAssets(assets, '/p', 'ios')).toBe(assets);
  });

  it('filters embedded fonts but keeps other assets and same-name different-extension', () => {
    vol.fromJSON({ 'fonts/MaterialIcons.ttf': '' }, '/project');

    jest.mocked(getConfig).mockReturnValue({
      exp: {
        name: 't',
        slug: 't',
        plugins: [['expo-font', { fonts: ['./fonts/MaterialIcons.ttf'] }]],
      },
      pkg: {},
    } as any);

    const assets = [
      makeAsset('MaterialIcons', 'ttf'),
      makeAsset('MaterialIcons', 'png'),
      makeAsset('splash', 'png'),
    ];

    const result = filterEmbeddedFontsFromAssets(assets, '/project', 'ios');
    expect(result).toEqual([makeAsset('MaterialIcons', 'png'), makeAsset('splash', 'png')]);
  });
});
