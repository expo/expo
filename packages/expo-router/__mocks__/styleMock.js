// Jest mock for CSS modules and plain style imports.
// Returns a proxy so any key access returns the key name, useful for className assertions.
module.exports = new Proxy(
  {},
  {
    get: (target, prop) => (typeof prop === 'string' ? prop : ''),
  }
);
