import path from 'path';

import linkRewrite from './remark-link-rewrite.js';

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
  const file = makeFile('index.mdx');

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
    const file = makeFile('index.mdx');
    expect(rewrite(file, './#a-header')).toBe('/#a-header');
  });

  it('resolves hash for nested page sibling', () => {
    const file = makeFile('push-notifications/overview.mdx');
    expect(rewrite(file, './using-fcm.mdx#a-header')).toBe(
      '/push-notifications/using-fcm/#a-header'
    );
  });

  it('resolves hash from nested to index', () => {
    const file = makeFile('push-notifications/overview.mdx');
    expect(rewrite(file, '../index.mdx#a-header')).toBe('/#a-header');
  });
});

describe('from pages/index.mdx', () => {
  const file = makeFile('index.mdx');

  it('resolves guides to /guides', () => {
    expect(rewrite(file, 'guides')).toBe('/guides');
  });

  it('resolves guides.md to /guides/', () => {
    expect(rewrite(file, 'guides.mdx')).toBe('/guides/');
  });

  it('resolves ./guides.md to /guides/', () => {
    expect(rewrite(file, './guides.mdx')).toBe('/guides/');
  });

  it('resolves ./nested/reference.md to /nested/reference/', () => {
    expect(rewrite(file, './nested/reference.mdx')).toBe('/nested/reference/');
  });
});

describe('from pages/push-notifications/overview.mdx', () => {
  const file = makeFile('push-notifications/overview.mdx');

  it('resolves using-fcm to /push-notifications/using-fcm', () => {
    expect(rewrite(file, 'using-fcm')).toBe('/push-notifications/using-fcm');
  });

  it('resolves using-fcm.md to /push-notifications/using-fcm/', () => {
    expect(rewrite(file, 'using-fcm.mdx')).toBe('/push-notifications/using-fcm/');
  });

  it('resolves ./using-fcm.md to /push-notifications/using-fcm/', () => {
    expect(rewrite(file, './using-fcm.mdx')).toBe('/push-notifications/using-fcm/');
  });

  it('resolves ../guides.md to /guides/', () => {
    expect(rewrite(file, '../guides.mdx')).toBe('/guides/');
  });

  it('resolves ./ to /push-notifications', () => {
    expect(rewrite(file, './')).toBe('/push-notifications');
  });

  it('resolves ../ to /', () => {
    expect(rewrite(file, '../')).toBe('/');
  });

  it('resolves ../index.md to /', () => {
    expect(rewrite(file, '../index.mdx')).toBe('/');
  });
});

describe('from pages/versions/latest/sdk/app-auth.mdx', () => {
  const file = makeFile('versions/latest/sdk/app-auth.mdx');

  it('resolves app-loading.md to /versions/latest/sdk/app-loading/', () => {
    expect(rewrite(file, 'app-loading.mdx')).toBe('/versions/latest/sdk/app-loading/');
  });

  it('resolves ./app-loading.md to /versions/latest/sdk/app-loading/', () => {
    expect(rewrite(file, './app-loading.mdx')).toBe('/versions/latest/sdk/app-loading/');
  });

  it('resolves ../config/app.md#android to /versions/latest/config/app/#android', () => {
    expect(rewrite(file, '../config/app.mdx#android')).toBe('/versions/latest/config/app/#android');
  });

  it('resolves ../../../workflow/debugging.md to /workflow/debugging/', () => {
    expect(rewrite(file, '../../../workflow/debugging.mdx')).toBe('/workflow/debugging/');
  });
});

describe('from pages/workflow/debugging.mdx', () => {
  const file = makeFile('workflow/debugging.mdx');

  it('resolves hash only to same file', () => {
    expect(rewrite(file, '#some-header')).toBe('/workflow/debugging/#some-header');
  });

  it('resolves hash with ./ to same file', () => {
    expect(rewrite(file, './#some-header')).toBe('/workflow/debugging/#some-header');
  });
});
