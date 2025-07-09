import * as Font from '../index';
import * as Server from '../server';

afterEach(() => {
  jest.resetModules();
});

it(`returns sync results`, () => {
  const name = 'foobar';
  const resource = { uri: 'font.ttf' };

  // Always true in Node
  expect(Font.isLoaded(name)).toBe(false);

  Font.loadAsync(name, resource);

  expect(Font.isLoaded(name)).toBe(true);
  expect(Server.getServerResources()).toEqual([
    '<style id="expo-generated-fonts" type="text/css">@font-face{font-family:foobar;src:url(font.ttf);font-display:auto}</style>',
    '<link rel="preload" href="font.ttf" as="font" crossorigin="" />',
  ]);

  Server.resetServerContext();
  expect(Font.isLoaded(name)).toBe(false);

  expect(Server.getServerResources()).toEqual([]);
});

it('getLoadedFonts is available', () => {
  expect(Font.getLoadedFonts()).toHaveLength(0);
});
