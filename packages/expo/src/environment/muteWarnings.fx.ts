// NOTE(2018-10-29): temporarily filter out cyclic dependency warnings here since they are noisy and
// each warning symbolicates a stack trace, which is slow when there are many warnings
const originalWarn = console.warn;
console.warn = function warn(...args) {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    /^Require cycle: .*node_modules/.test(args[0])
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
