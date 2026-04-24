import * as Font from '../index';
import * as Server from '../server';

afterEach(() => {
  jest.resetModules();
});

it(`returns sync results`, () => {
  const name = 'foo bar';
  const resource = { uri: 'font.ttf' };

  // Always true in Node
  expect(Font.isLoaded(name)).toBe(false);

  Font.loadAsync(name, resource);

  expect(Font.isLoaded(name)).toBe(true);
  expect(Server.getServerResources()).toEqual([
    '<style id="expo-generated-fonts">@font-face{font-family:"foo bar";src:url("font.ttf");font-display:auto}</style>',
    '<link rel="preload" href="font.ttf" as="font" crossorigin="" />',
  ]);
  expect(Server.getServerResourceDescriptors()).toEqual([
    {
      css: '@font-face{font-family:"foo bar";src:url("font.ttf");font-display:auto}',
      id: 'expo-generated-fonts',
      type: 'style',
    },
    {
      as: 'font',
      crossOrigin: '',
      href: 'font.ttf',
      rel: 'preload',
      type: 'link',
    },
  ]);

  Server.resetServerContext();
  expect(Font.isLoaded(name)).toBe(false);

  expect(Server.getServerResources()).toEqual([]);
  expect(Server.getServerResourceDescriptors()).toEqual([]);
});

it('getLoadedFonts is available', () => {
  expect(Font.getLoadedFonts()).toHaveLength(0);
});
