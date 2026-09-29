import { serializeLayoutSettings } from '../../layoutSettings';
import { inMemoryContext } from '../../testing-library/context-stubs';
import { collectStaticLayoutSettings } from '../collectStaticLayoutSettings';

describe(serializeLayoutSettings, () => {
  it('keeps the anchor and the group anchors', () => {
    expect(
      serializeLayoutSettings({
        anchor: 'index',
        initialRouteName: 'legacy',
        a: { anchor: 'a', initialRouteName: 'legacy-a' },
        b: { initialRouteName: 'b' },
      })
    ).toEqual({
      anchor: 'index',
      initialRouteName: 'legacy',
      a: { anchor: 'a', initialRouteName: 'legacy-a' },
      b: { initialRouteName: 'b' },
    });
  });

  it('drops settings that are not anchors', () => {
    expect(
      serializeLayoutSettings({
        anchor: 'index',
        screenErrorBoundary: () => null,
        a: { anchor: 42, other: true },
      })
    ).toEqual({ anchor: 'index' });
  });

  it('returns null without anchor settings', () => {
    expect(serializeLayoutSettings(undefined)).toBeNull();
    expect(serializeLayoutSettings({})).toBeNull();
    expect(serializeLayoutSettings({ screenErrorBoundary: () => null })).toBeNull();
  });
});

describe(collectStaticLayoutSettings, () => {
  it('collects the anchor settings of every layout by context key', () => {
    const context = inMemoryContext({
      _layout: () => null,
      index: () => null,
      '(tabs)/_layout': { default: () => null, unstable_settings: { anchor: 'home' } },
      '(tabs)/home': () => null,
      '(tabs)/anchored/_layout': {
        default: () => null,
        unstable_settings: { anchor: 'index', screenErrorBoundary: () => null },
      },
      '(tabs)/anchored/index': () => null,
      '(tabs)/anchored/details': () => null,
      'plain/_layout': () => null,
      'plain/index': () => null,
    });

    expect(collectStaticLayoutSettings(context)).toEqual({
      './(tabs)/_layout.js': { anchor: 'home' },
      './(tabs)/anchored/_layout.js': { anchor: 'index' },
    });
  });

  it('returns null when no layout has anchor settings', () => {
    const context = inMemoryContext({ _layout: () => null, index: () => null });

    expect(collectStaticLayoutSettings(context)).toBeNull();
  });

  it('returns the same result for the same context', () => {
    const context = inMemoryContext({
      _layout: { default: () => null, unstable_settings: { anchor: 'index' } },
      index: () => null,
    });

    expect(collectStaticLayoutSettings(context)).toBe(collectStaticLayoutSettings(context));
  });
});
