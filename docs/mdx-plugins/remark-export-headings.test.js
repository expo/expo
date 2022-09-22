import { u } from 'unist-builder';

import exportHeadings from './remark-export-headings.js';

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
    expect(getNodeByKey(data, 'title')).toHaveProperty('value', 'header title');
  });

  it('has title from multiple text children', () => {
    const { data } = transform(
      u('root', [u('heading', [u('text', 'header'), u('text', 'title')])])
    );
    expect(getNodeByKey(data, 'title')).toHaveProperty('value', 'header title');
  });

  it('has depth from heading', () => {
    const { data } = transform(u('root', [u('heading', { depth: 3 }, [u('text', 'title')])]));
    expect(getNodeByKey(data, 'depth')).toHaveProperty('value', 3);
  });

  it('has id when defined as data', () => {
    const { data } = transform(
      u('root', [u('heading', { data: { id: 'title' } }, [u('text', 'title')])])
    );
    expect(getNodeByKey(data, 'id')).toHaveProperty('value', 'title');
  });

  it('has text type from text children', () => {
    const { data } = transform(
      u('root', [u('heading', [u('text', 'hello there'), u('text', 'general kenobi')])])
    );
    expect(getNodeByKey(data, 'type')).toHaveProperty('value', 'text');
  });

  it('has inlineCode type from mixed children', () => {
    const { data } = transform(
      u('root', [u('heading', [u('text', 'hello there'), u('inlineCode', 'general kenobi')])])
    );
    expect(getNodeByKey(data, 'type')).toHaveProperty('value', 'inlineCode');
  });
});

/**
 * Helper function to run the MDAST transform, and find the added node.
 *
 * @param {import('mdast').Root} tree
 * @param {object} [options]
 */
function transform(tree, options = {}) {
  exportHeadings(options)(tree);

  const data = tree.children.find(node => node.type === 'mdxjsEsm').data.estree.body[0].declaration
    .declarations[0].init.elements;

  return { data };
}

function getNodeByKey(data, content) {
  return data[0].properties.find(property => property?.key?.value?.includes(content))?.value;
}
