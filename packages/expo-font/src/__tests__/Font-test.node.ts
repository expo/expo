import * as Font from '../index';
import * as Server from '../server';

afterEach(() => {
  jest.resetModules();
});

it(`returns sync results`, () => {
  const name = 'foo bar';
  const resource = { uri: 'font.ttf' };

  Server.withServerContext(() => {
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
  });

  expect(Font.isLoaded(name)).toBe(false);
  expect(Font.getLoadedFonts()).toHaveLength(0);
});

it('`getLoadedFonts()` is available', () => {
  expect(Font.getLoadedFonts()).toHaveLength(0);
});

it('`Font.loadAsync()` throws when called outside `withServerContext()`', () => {
  expect(() => Font.loadAsync('A', { uri: 'a.ttf' })).toThrow(/outside of withServerContext/);
});

it('isolates fonts between two concurrent server renders', async () => {
  // Each render is wrapped in `withServerContext()`; two overlapping renders must not leak fonts
  // into each other.
  const release: Record<'a' | 'b', () => void> = { a: () => {}, b: () => {} };
  const blocker = (key: 'a' | 'b') => new Promise<void>((resolve) => (release[key] = resolve));

  const renderA = Server.withServerContext(async () => {
    Font.loadAsync('FamilyA', { uri: 'a.ttf' });
    // Yield to render B mid-scope, proves the ALS store survives interleaved writes.
    await blocker('a');
    return Server.getServerResources();
  });

  const renderB = Server.withServerContext(async () => {
    Font.loadAsync('FamilyB', { uri: 'b.ttf' });
    await blocker('b');
    return Server.getServerResources();
  });

  release.b();
  release.a();

  const [resourcesA, resourcesB] = await Promise.all([renderA, renderB]);
  const htmlA = resourcesA.join('');
  const htmlB = resourcesB.join('');

  expect(htmlA).toContain('FamilyA');
  expect(htmlA).toContain('a.ttf');
  expect(htmlA).not.toContain('FamilyB');
  expect(htmlA).not.toContain('b.ttf');

  expect(htmlB).toContain('FamilyB');
  expect(htmlB).toContain('b.ttf');
  expect(htmlB).not.toContain('FamilyA');
  expect(htmlB).not.toContain('a.ttf');
});
