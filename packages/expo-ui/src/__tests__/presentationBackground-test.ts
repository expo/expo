import type { ColorValue } from 'react-native';

Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { presentationBackground } = require('../swift-ui/modifiers');

describe(presentationBackground, () => {
  const nativeColor = { semantic: ['label'] } as unknown as ColorValue;

  it('treats a top-level color as a color style', () => {
    expect(presentationBackground('#FF0000')).toEqual({
      $type: 'presentationBackground',
      style: { type: 'color', color: '#FF0000' },
    });
  });

  it('treats React Native color values as color styles', () => {
    expect(presentationBackground(nativeColor)).toEqual({
      $type: 'presentationBackground',
      style: { type: 'color', color: nativeColor },
    });
  });

  it('accepts materials', () => {
    expect(presentationBackground({ type: 'material', material: 'ultraThin' })).toEqual({
      $type: 'presentationBackground',
      style: { type: 'material', material: 'ultraThin' },
    });
  });

  it('accepts gradients', () => {
    expect(
      presentationBackground({
        type: 'linearGradient',
        colors: ['#FF0000', '#0000FF'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 1 },
      })
    ).toEqual({
      $type: 'presentationBackground',
      style: {
        type: 'linearGradient',
        colors: ['#FF0000', '#0000FF'],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 1 },
      },
    });
  });
});
