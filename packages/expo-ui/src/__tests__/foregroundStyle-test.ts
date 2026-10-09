import type { ColorValue } from 'react-native';

Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { foregroundStyle } = require('../swift-ui/modifiers');

describe(foregroundStyle, () => {
  // Mirrors the iOS runtime shape of PlatformColor('label') in React Native.
  // Android PlatformColor values use a different object shape (`resource_paths`).
  const nativeColor = { semantic: ['label'] } as unknown as ColorValue;

  it('treats top-level React Native color values as color styles', () => {
    expect(foregroundStyle(nativeColor)).toEqual({
      $type: 'foregroundStyle',
      style: { type: 'color', color: nativeColor },
    });
  });

  it('accepts React Native color values in explicit color styles', () => {
    expect(foregroundStyle({ type: 'color', color: nativeColor })).toEqual({
      $type: 'foregroundStyle',
      style: { type: 'color', color: nativeColor },
    });
  });

  it('accepts React Native color values in gradient styles', () => {
    expect(
      foregroundStyle({
        type: 'linearGradient',
        colors: [nativeColor, '#0000FF'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 },
      })
    ).toEqual({
      $type: 'foregroundStyle',
      style: {
        type: 'linearGradient',
        colors: [nativeColor, '#0000FF'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 },
      },
    });
  });

  it('renames the hierarchical style to the field the native side reads', () => {
    expect(foregroundStyle({ type: 'hierarchical', style: 'secondary' })).toEqual({
      $type: 'foregroundStyle',
      style: { type: 'hierarchical', hierarchical: 'secondary' },
    });
  });

  it('accepts materials', () => {
    expect(foregroundStyle({ type: 'material', material: 'ultraThin' })).toEqual({
      $type: 'foregroundStyle',
      style: { type: 'material', material: 'ultraThin' },
    });
  });
});
