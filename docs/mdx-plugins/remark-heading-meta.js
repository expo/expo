const visit = require('unist-util-visit');

const EXPORT_CONST_META = 'export const meta = ';

/**
 * This MDX remark plugin extracts all `heading` node titles and levels from MDAST
 * and injects it to `export` node exporting page metadata:
 * It looks for `export const meta = {...}` and injects a `headings` property to that object
 * 
 * Usage (Webpack):
```js
use: [
    babelMdxLoader,
    {
      loader: '@mdx-js/loader',
      options: { mdPlugins: [headings] },
    },
    join(__dirname, './common/md-loader'),
],
```
 * This plugin depends on `~/common/md-loader.js`, which adds `export const meta = ...` statement.
 */
module.exports = function() {
  return tree => {
    const headings = [];
    visit(tree, 'heading', node => {
      if (node.children.length > 0) {
        const title = node.children.map(it => it.value).join(' ');
        headings.push({ level: node.depth, title, type: node.children[0].type });
      }
    });

    visit(tree, 'export', node => {
      if (node.value.startsWith(EXPORT_CONST_META)) {
        const currentMeta = JSON.parse(node.value.substr(EXPORT_CONST_META.length));
        const newMeta = { ...currentMeta, headings };
        node.value = EXPORT_CONST_META + JSON.stringify(newMeta);
      }
    });
  };
};
