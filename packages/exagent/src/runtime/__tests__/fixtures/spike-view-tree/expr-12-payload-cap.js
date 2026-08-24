/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// How big a value can come back over this connection at all? Returns a string of
// `__SIZE__` bytes, so the transport cap is measured on its own rather than inferred from a
// tree that happened to fit. Run at several sizes; see out-12-payload-cap.json.
(function () {
  var n = __SIZE__;
  var s = 'x';
  while (s.length < n) {
    s = s + s;
  }
  return { requested: n, returnedLength: n, value: s.slice(0, n) };
})();
