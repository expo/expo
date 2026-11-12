import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import remarkDiffBlockRaw from './remark-diff-block-raw.js';

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIFF_PATH = '/static/diffs/sqlite-web-metro-config.diff';
const DIFF_CONTENT = fs.readFileSync(path.join(DOCS_ROOT, 'public', DIFF_PATH), 'utf8');

const transform = (attributes, name = 'DiffBlock') => {
  const node = {
    type: 'mdxJsxFlowElement',
    name,
    attributes: Object.entries(attributes).map(([attributeName, value]) => ({
      type: 'mdxJsxAttribute',
      name: attributeName,
      value,
    })),
  };
  remarkDiffBlockRaw()({ type: 'root', children: [node] }, { cwd: DOCS_ROOT });
  return Object.fromEntries(node.attributes.map(attribute => [attribute.name, attribute.value]));
};

describe('remarkDiffBlockRaw', () => {
  it('adds the diff file content as the raw prop', () => {
    expect(transform({ source: DIFF_PATH })).toEqual({ source: DIFF_PATH, raw: DIFF_CONTENT });
  });

  it('keeps an explicit raw prop', () => {
    expect(transform({ source: DIFF_PATH, raw: 'explicit' })).toEqual({
      source: DIFF_PATH,
      raw: 'explicit',
    });
  });

  it('skips a source that is not a static file on disk', () => {
    expect(transform({ source: '/static/diffs/does-not-exist.diff' })).toEqual({
      source: '/static/diffs/does-not-exist.diff',
    });
    expect(transform({ source: 'https://example.com/file.diff' })).toEqual({
      source: 'https://example.com/file.diff',
    });
  });

  it('skips other components', () => {
    expect(transform({ source: DIFF_PATH }, 'ContentSpotlight')).toEqual({ source: DIFF_PATH });
  });
});
