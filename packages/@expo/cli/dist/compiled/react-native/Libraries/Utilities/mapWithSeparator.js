'use strict';

function mapWithSeparator(items, itemRenderer, spacerRenderer) {
  var mapped = [];
  if (items.length > 0) {
    mapped.push(itemRenderer(items[0], 0, items));
    for (var ii = 1; ii < items.length; ii++) {
      mapped.push(spacerRenderer(ii - 1), itemRenderer(items[ii], ii, items));
    }
  }
  return mapped;
}
module.exports = mapWithSeparator;
//# sourceMappingURL=mapWithSeparator.js.map