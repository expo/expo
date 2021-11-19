const yaml = require('js-yaml');
const visit = require('unist-util-visit');

/**
 * @typedef {import('mdast').Root} Root - https://github.com/syntax-tree/mdast#root
 * @typedef {import('mdast').YAML} Yaml - https://github.com/syntax-tree/mdast#yaml
 */

/**
 * Find the first yaml node within a MDX document, and export it as JS constant.
 * When no yaml was found, it still exports an empty object.
 * Note, the frontmatter block should be parsed first with `remark-frontmatter`.
 *
 * @param {object} options
 * @param {string} [options.exportName="meta"]
 */
module.exports = function remarkExportYaml(options = {}) {
  const { exportName = 'meta' } = options;

  /** @param {Root} tree */
  return tree => {
    let yamlTransformed = false;

    /** @param {Yaml} node -  */
    const visitor = node => {
      const data = yaml.load(node.value);

      node.type = 'export';
      node.value = `export const ${exportName} = ${JSON.stringify(data)};`;
      node.position = undefined;

      yamlTransformed = true;

      return visit.EXIT;
    };

    visit(tree, 'yaml', visitor);

    if (!yamlTransformed) {
      tree.children.push({
        type: 'export',
        value: `export const ${exportName} = {};`,
      });
    }
  };
};
