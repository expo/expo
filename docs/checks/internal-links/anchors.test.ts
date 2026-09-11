import * as cheerio from 'cheerio';

import { collectIds, hasAnchor } from './anchors.ts';

describe(collectIds, () => {
  it('collects every element id in the document', () => {
    const ids = collectIds(cheerio.load('<h2 id="setup">s</h2><div><span id="usage"/></div>'));
    expect(ids.has('setup')).toBe(true);
    expect(ids.has('usage')).toBe(true);
    expect(ids.size).toBe(2);
  });
});

describe(hasAnchor, () => {
  const idsByPage = new Map([['/guides/overview', new Set(['setup', 'foo bar'])]]);

  it('accepts an existing anchor', () => {
    expect(hasAnchor(idsByPage, '/guides/overview', 'setup')).toBe(true);
  });

  it('matches url-encoded hashes against decoded ids', () => {
    expect(hasAnchor(idsByPage, '/guides/overview', 'foo%20bar')).toBe(true);
  });

  it('rejects a missing anchor', () => {
    expect(hasAnchor(idsByPage, '/guides/overview', 'nope')).toBe(false);
  });

  it('rejects anchors on unknown pages', () => {
    expect(hasAnchor(idsByPage, '/unknown', 'setup')).toBe(false);
  });
});
