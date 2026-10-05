// NOTE(@kitten): This module is also async-imported by the app, and hence shared
// in an async chunk. This module, however, must be duplicated in the web worker, since
// web workers are self-sufficient bundles, and must not be common-chunk-split
export function multiply(a: number, b: number) {
  return a * b;
}
