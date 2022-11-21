"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reverseSortString = void 0;
exports.sortObjWithOrder = sortObjWithOrder;
exports.sortObject = sortObject;
exports.sortWithOrder = sortWithOrder;
function sortObject(obj, compareFn) {
  return Object.keys(obj).sort(compareFn).reduce((acc, key) => ({
    ...acc,
    [key]: obj[key]
  }), {});
}
function sortObjWithOrder(obj, order) {
  const sorted = sortWithOrder(Object.keys(obj), order);
  return sorted.reduce((acc, key) => ({
    ...acc,
    [key]: obj[key]
  }), {});
}
function sortWithOrder(obj, order) {
  const groupOrder = [...new Set(order.concat(obj))];
  const sorted = [];
  while (groupOrder.length) {
    const key = groupOrder.shift();
    const index = obj.indexOf(key);
    if (index > -1) {
      const [item] = obj.splice(index, 1);
      sorted.push(item);
    }
  }
  return sorted;
}
const reverseSortString = (a, b) => {
  if (a < b) return 1;
  if (a > b) return -1;
  return 0;
};
exports.reverseSortString = reverseSortString;
//# sourceMappingURL=sortObject.js.map