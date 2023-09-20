function isNativeFunction(f) {
  return typeof f === 'function' && f.toString().indexOf('[native code]') > -1;
}
function hasNativeConstructor(o, expectedName) {
  var con = Object.getPrototypeOf(o).constructor;
  return con.name === expectedName && isNativeFunction(con);
}
module.exports = {
  isNativeFunction: isNativeFunction,
  hasNativeConstructor: hasNativeConstructor
};
//# sourceMappingURL=FeatureDetection.js.map