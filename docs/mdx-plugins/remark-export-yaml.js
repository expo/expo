const yaml = require('js-yaml');
const visit = require('unist-util-visit-parents');

module.exports = function (options = { exportName: 'meta' }) {
  return tree => {
    visit(tree, 'yaml', (node) => {
      const data = yaml.load(node.value);

      node.type = 'export';
      node.value = `export const ${options.exportName} = ${JSON.stringify(data)};`;
      node.position = undefined;

      return visit.EXIT;
    });
  };
};
