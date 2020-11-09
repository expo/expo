import path from 'path';

import linkRewrite from './remark-link-rewrite';

// helper functions to construct remark nodes
const makeFile = filePath => ({
  cwd: '/absolue/path/to/docs',
  history: [path.join('/absolue/path/to/docs/pages', filePath)],
});
const rewrite = (file, url) => {
  const link = { type: 'link', url };
  const tree = { type: 'root', children: [link] };
  linkRewrite()(tree, file);
  return link.url;
};

describe('only rewrites internal links', () => {
  const file = makeFile('index.md');

  it('skips https://external.link', () => {
    expect(rewrite(file, 'https://external.link')).toBe('https://external.link');
  });

  it('skips http://external.link?some=query', () => {
    expect(rewrite(file, 'http://external.link?some=query')).toBe(
      'http://external.link?some=query'
    );
  });
});

describe('from index page', () => {
  const file = makeFile('index.md');

  it('resolves guides to guides', () => {
    expect(rewrite(file, 'guides')).toBe('guides');
  });

  it('resolves guides.md to guides/', () => {
    expect(rewrite(file, 'guides.md')).toBe('guides/');
  });

  it('resolves ./guides.md to /guides/', () => {
    expect(rewrite(file, './guides.md')).toBe('/guides/');
  });

  // legacy method of linking, hardcoding trailing slash
  it('resolves ../guides.md to /guides/', () => {
    expect(rewrite(file, '../guides.md')).toBe('/guides/');
  });

  // legacy method of linking, hardcoding trailing slash
  it('resolves ../guides/ to /guides/', () => {
    expect(rewrite(file, '../guides/')).toBe('/guides/');
  });
});

describe('from nested page', () => {
  const file = makeFile('push-notifications/overview.md');

  it('resolves using-fcm to using-fcm', () => {
    expect(rewrite(file, 'using-fcm')).toBe('using-fcm');
  });

  it('resolves using-fcm.md to using-fcm/', () => {
    expect(rewrite(file, 'using-fcm.md')).toBe('using-fcm/');
  });

  it('resolves ./using-fcm.md to /push-notifications/using-fcm/', () => {
    expect(rewrite(file, './using-fcm.md')).toBe('/push-notifications/using-fcm/');
  });

  // legacy method of linking, hardcoding trailing slash
  it('resolves ../using-fcm.md to /push-notifications/using-fcm/', () => {
    expect(rewrite(file, '../using-fcm.md')).toBe('/push-notifications/using-fcm/');
  });

  // legacy method of linking, hardcoding trailing slash
  it('resolves ../using-fcm/ to /push-notifications/using-fcm/', () => {
    expect(rewrite(file, '../using-fcm/')).toBe('/push-notifications/using-fcm/');
  });

  it('resolves ./ to /push-notifications/', () => {
    expect(rewrite(file, './')).toBe('/push-notifications/');
  });

  it('resolves ../ to /push-notifications/', () => {
    expect(rewrite(file, '../')).toBe('/push-notifications/');
  });
});

describe('header reference', () => {
  it('resolves hash for index', () => {
    const file = makeFile('index.md');
    expect(rewrite(file, './#a-header')).toBe('/#a-header');
  });

  it('resolves hash for nested page sibling', () => {
    const file = makeFile('push-notifications/overview.md');
    expect(rewrite(file, './using-fcm.md#a-header')).toBe(
      '/push-notifications/using-fcm/#a-header'
    );
  });
});
