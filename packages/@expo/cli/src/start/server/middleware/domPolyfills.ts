/**
 * Inline polyfills for legacy WebViews (e.g., Android 9) used by DOM Components.
 * These run before any application code to ensure baseline API availability.
 */
export const DOM_POLYFILLS_SCRIPT = `
// Polyfill globalThis
if (typeof globalThis === "undefined") {
  var _g = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : self;
  _g.globalThis = _g;
}
// Polyfill Array.prototype.flat
if (!Array.prototype.flat) {
  Array.prototype.flat = function flat(depth) {
    depth = depth === undefined ? 1 : Math.floor(Number(depth));
    if (depth < 1) return Array.prototype.slice.call(this);
    return Array.prototype.reduce.call(
      this,
      function (acc, val) {
        if (Array.isArray(val)) {
          acc.push.apply(acc, flat.call(val, depth - 1));
        } else {
          acc.push(val);
        }
        return acc;
      },
      []
    );
  };
}
// Polyfill performance.measure with measureOptions.
// Legacy WebViews only support performance.measure(name, startMark, endMark) with
// string mark names. When called with a measureOptions object (e.g., { start, end }),
// we drop the options and call measure(name) to avoid throwing.
try {
  performance.measure("__expo_feature_test", { start: 0 });
  performance.clearMeasures("__expo_feature_test");
} catch (e) {
  var _origMeasure = performance.measure.bind(performance);
  performance.measure = function (name, startOrOptions, endMark) {
    if (startOrOptions && typeof startOrOptions === "object") {
      return _origMeasure(name);
    }
    return _origMeasure(name, startOrOptions, endMark);
  };
}
`;
