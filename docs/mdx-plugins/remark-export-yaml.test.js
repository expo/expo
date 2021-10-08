import u from 'unist-builder';

import exportYaml from './remark-export-yaml';

describe('exports constant', () => {
  it('when yaml content was not found', () => {
    const { data } = transform(u('root', [u('text', 'lorem ipsum')]));
    expect(data).toMatchObject({});
  });

  it('when yaml content is found', () => {
    const { data } = transform(u('root', [u('yaml', 'title: Page title\nhideTOC: true')]));
    expect(data).toMatchObject({
      title: 'Page title',
      hideTOC: true,
    });
  });
});

/**
 * Helper function to run the MDAST transform, and find the added or changed node.
 *
 * @param {import('mdast').Root} tree
 * @param {object} [options]
 * @param {string} [options.exportName]
 */
function transform(tree, options = {}) {
  exportYaml(options)(tree);

  const value = `export const ${options.exportName || 'meta'} = `;
  const node = tree.children
    .reverse()
    .find(node => node.type === 'export' && node.value.startsWith(value));

  const json = node ? node.value.replace(value, '').replace(/;$/, '') : null;
  const data = json ? JSON.parse(json) : null;

  return { node, json, data };
}
