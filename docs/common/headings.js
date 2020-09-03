const visit = require('unist-util-visit');

const EXPORT_CONST_META = 'export const meta = ';

module.exports = function() {
  return (tree, file) => {
    //console.log('tree', tree);
    //console.log('file', file);
    const headings = [];
    visit(tree, 'heading', node => {
      console.log(node.children[0].position);
      headings.push({ level: node.depth, title: node.children[0].value });
    });

    /*headings.forEach(heading => {
      console.log('|' + new Array(heading.level).join('-'), heading.title);
    });*/

    visit(tree, 'export', node => {
      if (node.value.startsWith(EXPORT_CONST_META)) {
        const currentMeta = JSON.parse(node.value.substr(EXPORT_CONST_META.length));
        const newMeta = { ...currentMeta, headings };
        node.value = EXPORT_CONST_META + JSON.stringify(newMeta);
      }
    });
  };
};
