import u from 'unist-builder';

import exportHeadings from './remark-export-headings';

describe('exports constant', () => {
  it('when no headers are found', () => {
    const { data } = transform(u('root', [u('text', 'lorem ipsum')]));
    expect(data).not.toBeNull();
    expect(data).toHaveLength(0);
  });

  it('when single header is found', () => {
    const { data } = transform(u('root', [u('heading', [u('text', 'lorem ipsum')])]));
    expect(data).toHaveLength(1);
  });

  it('when multiple headers are found', () => {
    const { data } = transform(
      u('root', [u('heading', [u('text', 'lorem ipsum')]), u('heading', [u('text', 'sit amet')])])
    );
    expect(data).toHaveLength(2);
  });
});

describe('header object', () => {
  it('has title from text child', () => {
    const { data } = transform(u('root', [u('heading', [u('text', 'header title')])]));
    expect(data[0]).toHaveProperty('title', 'header title');
  });

  it('has title from multiple text children', () => {
    const { data } = transform(
      u('root', [u('heading', [u('text', 'header'), u('text', 'title')])])
    );
    expect(data[0]).toHaveProperty('title', 'header title');
  });

  it('has depth from heading', () => {
    const { data } = transform(u('root', [u('heading', { depth: 3 }, [u('text', 'title')])]));
    expect(data[0]).toHaveProperty('depth', 3);
  });

  it('has id when defined as data', () => {
    const { data } = transform(
      u('root', [u('heading', { data: { id: 'title' } }, [u('text', 'title')])])
    );
    expect(data[0]).toHaveProperty('id', 'title');
  });

  it('has text type from text children', () => {
    const { data } = transform(
      u('root', [u('heading', [u('text', 'hello there'), u('text', 'general kenobi')])])
    );
    expect(data[0]).toHaveProperty('type', 'text');
  });

  it('has inlineCode type from mixed children', () => {
    const { data } = transform(
      u('root', [u('heading', [u('text', 'hello there'), u('inlineCode', 'general kenobi')])])
    );
    expect(data[0]).toHaveProperty('type', 'inlineCode');
  });
});

/**
 * Helper function to run the MDAST transform, and find the added node.
 *
 * @param {import('mdast').Root} tree
 * @param {object} [options]
 * @param {string} [options.exportName]
 */
function transform(tree, options = {}) {
  exportHeadings(options)(tree);

  const value = `export const ${options.exportName || 'headings'} = `;
  const node = tree.children
    .reverse()
    .find(node => node.type === 'export' && node.value.startsWith(value));

  const json = node ? node.value.replace(value, '').replace(/;$/, '') : null;
  const data = json ? JSON.parse(json) : null;

  return { node, json, data };
}
