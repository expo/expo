import * as Font from '../index';
import { FontResource } from '../index';
import * as Server from '../server';

afterEach(() => {
  jest.resetModules();
});

it(`returns sync results`, () => {
  const name = 'foo bar';
  const resource: FontResource = { uri: 'font.ttf', weight: 'lighter normal' };

  // Always true in Node
  expect(Font.isLoaded(name)).toBe(false);

  Font.loadAsync({
    [name]: resource,
    [name + 'bold']: { family: name, uri: 'font-bold.ttf', weight: 'bold' },
  });

  expect(Font.isLoaded(name)).toBe(true);
  expect(Server.getServerResources()).toEqual([
    '<style id="expo-generated-fonts">' +
      '@font-face{font-family:"foo bar";src:url("font.ttf");font-weight:lighter normal;font-display:auto;}' +
      '\n' +
      '@font-face{font-family:"foo bar";src:url("font-bold.ttf");font-weight:bold;font-display:auto;}' +
      '</style>',
    '<link rel="preload" href="font.ttf" as="font" crossorigin="" />',
    '<link rel="preload" href="font-bold.ttf" as="font" crossorigin="" />',
  ]);

  Server.resetServerContext();
  expect(Font.isLoaded(name)).toBe(false);

  expect(Server.getServerResources()).toEqual([]);
});

it('getLoadedFonts is available', () => {
  expect(Font.getLoadedFonts()).toHaveLength(0);
});
