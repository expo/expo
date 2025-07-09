import { visit } from 'unist-util-visit';

/**
 * @typedef {import('@types/mdast').Root} Root - https://github.com/syntax-tree/mdast#root
 */

export default function remarkSDKCompatibility() {
  /** @param {Root} tree */
  return tree => {
    visit(tree, 'text', node => {
      node.value = node.value.replace(
        /\^{3}(\d+)/g,
        (_, sdkVersion) => `(available in Expo SDK ${sdkVersion} or higher)`
      );
    });
  };
}
