"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseSortString = exports.sortWithOrder = exports.sortObjWithOrder = exports.sortObject = void 0;
function sortObject(obj, compareFn) {
    return Object.keys(obj)
        .sort(compareFn)
        .reduce((acc, key) => ({
        ...acc,
        [key]: obj[key],
    }), {});
}
exports.sortObject = sortObject;
function sortObjWithOrder(obj, order) {
    const sorted = sortWithOrder(Object.keys(obj), order);
    return sorted.reduce((acc, key) => ({
        ...acc,
        [key]: obj[key],
    }), {});
}
exports.sortObjWithOrder = sortObjWithOrder;
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
exports.sortWithOrder = sortWithOrder;
const reverseSortString = (a, b) => {
    if (a < b)
        return 1;
    if (a > b)
        return -1;
    return 0;
};
exports.reverseSortString = reverseSortString;
