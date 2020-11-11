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

describe('maintains header reference', () => {
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

  it('resolves hash from nested to index', () => {
    const file = makeFile('push-notifications/overview.md');
    expect(rewrite(file, '../index.md#a-header')).toBe('/#a-header');
  });
});

describe('from pages/index.md', () => {
  const file = makeFile('index.md');

  it('resolves guides to /guides', () => {
    expect(rewrite(file, 'guides')).toBe('/guides');
  });

  it('resolves guides.md to /guides/', () => {
    expect(rewrite(file, 'guides.md')).toBe('/guides/');
  });

  it('resolves ./guides.md to /guides/', () => {
    expect(rewrite(file, './guides.md')).toBe('/guides/');
  });

  it('resolves ./nested/reference.md to /nested/reference/', () => {
    expect(rewrite(file, './nested/reference.md')).toBe('/nested/reference/');
  });
});

describe('from pages/push-notifications/overview.md', () => {
  const file = makeFile('push-notifications/overview.md');

  it('resolves using-fcm to /push-notifications/using-fcm', () => {
    expect(rewrite(file, 'using-fcm')).toBe('/push-notifications/using-fcm');
  });

  it('resolves using-fcm.md to /push-notifications/using-fcm/', () => {
    expect(rewrite(file, 'using-fcm.md')).toBe('/push-notifications/using-fcm/');
  });

  it('resolves ./using-fcm.md to /push-notifications/using-fcm/', () => {
    expect(rewrite(file, './using-fcm.md')).toBe('/push-notifications/using-fcm/');
  });

  it('resolves ../guides.md to /guides/', () => {
    expect(rewrite(file, '../guides.md')).toBe('/guides/');
  });

  it('resolves ./ to /push-notifications', () => {
    expect(rewrite(file, './')).toBe('/push-notifications');
  });

  it('resolves ../ to /', () => {
    expect(rewrite(file, '../')).toBe('/');
  });

  it('resolves ../index.md to /', () => {
    expect(rewrite(file, '../index.md')).toBe('/');
  });
});

describe('from pages/versions/latest/sdk/app-auth.md', () => {
  const file = makeFile('versions/latest/sdk/app-auth.md');

  it('resolves app-loading.md to /versions/latest/sdk/app-loading/', () => {
    expect(rewrite(file, 'app-loading.md')).toBe('/versions/latest/sdk/app-loading/');
  });

  it('resolves ./app-loading.md to /versions/latest/sdk/app-loading/', () => {
    expect(rewrite(file, './app-loading.md')).toBe('/versions/latest/sdk/app-loading/');
  });

  it('resolves ../config/app.md#android to /versions/latest/config/app/#android', () => {
    expect(rewrite(file, '../config/app.md#android')).toBe('/versions/latest/config/app/#android');
  });

  it('resolves ../../../workflow/debugging.md to /workflow/debugging/', () => {
    expect(rewrite(file, '../../../workflow/debugging.md')).toBe('/workflow/debugging/');
  });
});
