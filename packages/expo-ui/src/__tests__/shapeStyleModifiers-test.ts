Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { tint, border, strokeBorder, containerBackground } = require('../swift-ui/modifiers');

const material = { type: 'material', material: 'thin' } as const;
const resolvedMaterial = { type: 'material', material: 'thin' };

describe(tint, () => {
  it('treats a top-level color as a color style', () => {
    expect(tint('#FF0000')).toEqual({
      $type: 'tint',
      tint: { type: 'color', color: '#FF0000' },
    });
  });

  it('accepts materials', () => {
    expect(tint(material)).toEqual({ $type: 'tint', tint: resolvedMaterial });
  });
});

describe(border, () => {
  it('accepts materials', () => {
    expect(border({ content: material, width: 2 })).toEqual({
      $type: 'border',
      content: resolvedMaterial,
      width: 2,
    });
  });

  it('still accepts the deprecated color parameter', () => {
    expect(border({ color: '#FF0000' })).toEqual({
      $type: 'border',
      content: { type: 'color', color: '#FF0000' },
    });
  });
});

describe(strokeBorder, () => {
  it('keeps the stroke style next to the shape style', () => {
    expect(strokeBorder({ content: material, style: { lineWidth: 2 } })).toEqual({
      $type: 'strokeBorder',
      content: resolvedMaterial,
      style: { lineWidth: 2 },
    });
  });

  it('still accepts the deprecated color parameter', () => {
    expect(strokeBorder({ color: '#FF0000', shape: 'capsule' })).toEqual({
      $type: 'strokeBorder',
      content: { type: 'color', color: '#FF0000' },
      shape: 'capsule',
    });
  });

  it('omits the shape style when neither is given, so SwiftUI uses its own default', () => {
    expect(strokeBorder({ style: { lineWidth: 2 } })).toEqual({
      $type: 'strokeBorder',
      style: { lineWidth: 2 },
    });
  });
});

describe(containerBackground, () => {
  it('accepts materials', () => {
    expect(containerBackground(material, 'widget')).toEqual({
      $type: 'containerBackground',
      style: resolvedMaterial,
      container: 'widget',
    });
  });
});
