import type { ImageStyle } from 'react-native';

import type { ImageNativeProps, ImageSource } from '../Image.types';
import { resolveDefaultSize } from '../utils';

const source: ImageSource[] = [{ uri: 'file:///image.png', width: 100, height: 50 }];

describe('resolveDefaultSize', () => {
  it('returns the size declared by the source', () => {
    expect(resolveDefaultSize(source, {})).toEqual({ width: 100, height: 50 });
  });

  it('returns the size when the style has no sizing properties', () => {
    expect(resolveDefaultSize(source, { opacity: 0.5, position: 'relative' })).toEqual({
      width: 100,
      height: 50,
    });
  });

  it('returns null when the source declares no size', () => {
    expect(resolveDefaultSize([{ uri: 'https://example.com/image.png' }], {})).toBeNull();
    expect(resolveDefaultSize([{ uri: 'file:///image.png', width: 100 }], {})).toBeNull();
  });

  it('returns null when there is no source or more than one', () => {
    expect(resolveDefaultSize([], {})).toBeNull();
    expect(resolveDefaultSize([...source, ...source], {})).toBeNull();
  });

  it('returns null for a shared reference to an image', () => {
    // An `ImageRef` is resolved to the id of its shared object, which carries no size.
    const sharedObjectId = 42 as unknown as ImageNativeProps['source'];
    expect(resolveDefaultSize(sharedObjectId, {})).toBeNull();
  });

  it.each([
    'width',
    'height',
    'minWidth',
    'minHeight',
    'aspectRatio',
    'flex',
    'flexGrow',
    'flexBasis',
  ])('returns null when the style sets %s', (property) => {
    expect(resolveDefaultSize(source, { [property]: 1 } as ImageStyle)).toBeNull();
  });

  it('returns null when the view is absolutely positioned', () => {
    expect(resolveDefaultSize(source, { position: 'absolute' })).toBeNull();
  });

  it.each(['padding', 'paddingHorizontal', 'paddingTop', 'paddingInline', 'paddingBlockStart'])(
    'returns null when the style sets %s',
    (property) => {
      expect(resolveDefaultSize(source, { [property]: 10 } as ImageStyle)).toBeNull();
    }
  );

  it.each(['borderWidth', 'borderTopWidth', 'borderStartWidth'])(
    'returns null when the style sets %s',
    (property) => {
      expect(resolveDefaultSize(source, { [property]: 2 } as ImageStyle)).toBeNull();
    }
  );

  it('returns the size when the style sets a non-sizing border/color property', () => {
    expect(resolveDefaultSize(source, { borderColor: 'red', borderRadius: 4 })).toEqual({
      width: 100,
      height: 50,
    });
  });
});
