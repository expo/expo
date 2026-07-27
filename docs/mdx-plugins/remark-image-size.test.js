import path from 'node:path';
import { fileURLToPath } from 'node:url';

import remarkImageSize, { getImageSize } from './remark-image-size.js';

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// helper functions to construct remark nodes
const makeNode = attributes => ({
  type: 'mdxJsxFlowElement',
  name: 'ContentSpotlight',
  attributes: Object.entries(attributes).map(([name, value]) => ({
    type: 'mdxJsxAttribute',
    name,
    value,
  })),
});

const transform = node => {
  const tree = { type: 'root', children: [node] };
  remarkImageSize()(tree, { cwd: DOCS_ROOT });
  return Object.fromEntries(
    node.attributes.map(attribute => [
      attribute.name,
      typeof attribute.value === 'string' ? attribute.value : attribute.value?.value,
    ])
  );
};

describe('getImageSize', () => {
  it('reads PNG dimensions', () => {
    expect(
      getImageSize(path.join(DOCS_ROOT, 'public/static/images/sdk/notifications/categories.png'))
    ).toEqual({ width: 2400, height: 1136 });
  });

  it('reads JPEG dimensions', () => {
    expect(
      getImageSize(path.join(DOCS_ROOT, 'public/static/images/notification-sound-ios.jpeg'))
    ).toEqual({ width: 272, height: 375 });
  });

  it('reads WebP dimensions', () => {
    expect(
      getImageSize(path.join(DOCS_ROOT, 'public/static/images/apple-access-settings.webp'))
    ).toEqual({ width: 992, height: 472 });
  });

  it('reads AVIF dimensions', () => {
    expect(
      getImageSize(path.join(DOCS_ROOT, 'public/static/images/atlas/atlas-overview.avif'))
    ).toEqual({ width: 3320, height: 2158 });
  });

  it('returns null for missing files', () => {
    expect(getImageSize(path.join(DOCS_ROOT, 'public/static/images/does-not-exist.png'))).toBe(
      null
    );
  });
});

describe('remarkImageSize', () => {
  it('injects width and height for static images', () => {
    const node = makeNode({ src: '/static/images/sdk/notifications/categories.png' });
    expect(transform(node)).toEqual({
      src: '/static/images/sdk/notifications/categories.png',
      width: '2400',
      height: '1136',
    });
  });

  it('keeps explicit width and height', () => {
    const node = makeNode({
      src: '/static/images/sdk/notifications/categories.png',
      width: '100',
    });
    expect(transform(node)).toEqual({
      src: '/static/images/sdk/notifications/categories.png',
      width: '100',
    });
  });

  it('skips external images', () => {
    const node = makeNode({ src: 'https://external.link/image.png' });
    expect(transform(node)).toEqual({ src: 'https://external.link/image.png' });
  });

  it('skips missing images', () => {
    const node = makeNode({ src: '/static/images/does-not-exist.png' });
    expect(transform(node)).toEqual({ src: '/static/images/does-not-exist.png' });
  });

  it('skips other components', () => {
    const node = {
      ...makeNode({ src: '/static/images/sdk/notifications/categories.png' }),
      name: 'BoxLink',
    };
    expect(transform(node)).toEqual({ src: '/static/images/sdk/notifications/categories.png' });
  });
});
