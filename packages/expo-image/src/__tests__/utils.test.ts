import type { ImageStyle } from 'react-native';

import type { ImageNativeProps, ImageSource } from '../Image.types';
import { resolveDefaultSize } from '../utils';
import { resolveSources } from '../utils/resolveSources';

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

  it.each([
    [0, 0],
    [100, 0],
    [-1, -1],
    [NaN, NaN],
    [Infinity, 100],
  ])('returns null when the source declares an unusable size (%p x %p)', (width, height) => {
    expect(resolveDefaultSize([{ uri: 'file:///image.png', width, height }], {})).toBeNull();
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

  it.each(['padding', 'paddingHorizontal', 'borderWidth', 'borderTopWidth'])(
    'returns the size when the style sets only %s',
    (property) => {
      expect(resolveDefaultSize(source, { [property]: 10 } as ImageStyle)).toEqual({
        width: 100,
        height: 50,
      });
    }
  );

  it.each([
    ['a blurhash string', 'blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj'],
    ['a blurhash with a size', { blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', width: 32, height: 32 }],
    [
      'a thumbhash with a size',
      { thumbhash: '1QcSHQRnh493V4dIh4eXh1h4kJUI', width: 32, height: 32 },
    ],
  ])('returns null for %s', (_, hashSource) => {
    expect(resolveDefaultSize(resolveSources(hashSource), {})).toBeNull();
  });

  it('returns the size when the style sets a non-sizing border/color property', () => {
    expect(resolveDefaultSize(source, { borderColor: 'red', borderRadius: 4 })).toEqual({
      width: 100,
      height: 50,
    });
  });
});
