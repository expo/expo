import { visit } from 'unist-util-visit';

/**
 * This simple plugin appends the code block meta to the node value.
 */
export default function remarkLinkRewrite() {
  return (tree, file) => {
    if (!file.cwd || !file.history || file.history.length === 0) {
      return;
    }

    visit(tree, 'code', node => {
      if (node.meta) {
        node.value = '@@@' + node.meta + '@@@' + node.value;
      }
    });
  };
}
