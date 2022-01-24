const navigation = require('./navigation');

// Clean up a couple of properties to minimize the footprint of the navigation data.
// This always removes the 'weight', this is now hard coded into the list order.
// Remove both 'hidden: false' and 'sidebarTitle: undefined' properties.
const visitor = node => {
  delete node.weight;
  if (!node.hidden) delete node.hidden;
  if (!node.sidebarTitle) delete node.sidebarTitle;
};

// Go over the main properties of navigation
visit(navigation.starting, visitor);
visit(navigation.general, visitor);
visit(navigation.eas, visitor);
visit(navigation.preview, visitor);
visit(navigation.featurePreview, visitor);
// Go over each version
for (const version in navigation.reference) {
  visit(navigation.reference[version], visitor);
}

it('outputs the expected navigation information', () => {
  expect(navigation).toMatchSnapshot();
});

/**
 * Iterate over the trees and nodes to perform actions on nodes.
 * This is a wacky version of `unist-util-visit` because or current tree doesn't match the spec.
 *
 * @todo restructure the tree data with the unist spec
 */
function visit(nodeOrList, visitor) {
  if (Array.isArray(nodeOrList)) {
    for (const node of nodeOrList) {
      visit(node, visitor);
    }
    return;
  }

  visitor(nodeOrList, parent);
  const children = nodeOrList.children || nodeOrList.posts || [];
  for (const child of children) {
    visit(child, visitor);
  }
}
