Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEntriesIterator = createEntriesIterator;
exports.createKeyIterator = createKeyIterator;
exports.createValueIterator = createValueIterator;
function* createValueIterator(arrayLike) {
  for (var i = 0; i < arrayLike.length; i++) {
    yield arrayLike[i];
  }
}
function* createKeyIterator(arrayLike) {
  for (var i = 0; i < arrayLike.length; i++) {
    yield i;
  }
}
function* createEntriesIterator(arrayLike) {
  for (var i = 0; i < arrayLike.length; i++) {
    yield [i, arrayLike[i]];
  }
}