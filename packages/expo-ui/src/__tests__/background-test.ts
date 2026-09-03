import type { ColorValue } from 'react-native';

Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { background, shapes } = require('../swift-ui/modifiers');

describe(background, () => {
  // Mirrors the iOS runtime shape of PlatformColor('label') in React Native.
  const nativeColor = { semantic: ['label'] } as unknown as ColorValue;

  it('treats a top-level color as a color style', () => {
    expect(background('#FF0000')).toEqual({
      $type: 'background',
      style: { type: 'color', color: '#FF0000' },
    });
  });

  it('treats React Native color values as color styles', () => {
    expect(background(nativeColor)).toEqual({
      $type: 'background',
      style: { type: 'color', color: nativeColor },
    });
  });

  it('accepts materials', () => {
    expect(background({ type: 'material', material: 'ultraThin' })).toEqual({
      $type: 'background',
      style: { type: 'material', material: 'ultraThin' },
    });
  });

  it('accepts gradients', () => {
    expect(
      background({
        type: 'linearGradient',
        colors: ['#FF0000', '#0000FF'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 },
      })
    ).toEqual({
      $type: 'background',
      style: {
        type: 'linearGradient',
        colors: ['#FF0000', '#0000FF'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 },
      },
    });
  });

  it('keeps the shape fields next to the style', () => {
    expect(background('#FF0000', shapes.roundedRectangle({ cornerRadius: 12 }))).toEqual({
      $type: 'background',
      style: { type: 'color', color: '#FF0000' },
      shape: 'roundedRectangle',
      cornerRadius: 12,
    });
  });

  it('accepts an undefined shape', () => {
    expect(background('#FF0000', undefined)).toEqual({
      $type: 'background',
      style: { type: 'color', color: '#FF0000' },
    });
  });

  it('forwards the safe area edges', () => {
    expect(background('#FF0000', { ignoresSafeAreaEdges: 'horizontal' })).toEqual({
      $type: 'background',
      style: { type: 'color', color: '#FF0000' },
      ignoresSafeAreaEdges: 'horizontal',
    });
  });
});
