/**
 * local-exports-invalid-inject-undefined plugin
 * @param {import("@babel/core").PluginAPI} api
 * @returns
 */
module.exports = function(api) {
  const { types: t } = api;
  /**
   * @type {import("@babel/core").PluginObject}
   */
  const plugin = {
    name: "local-exports-invalid-inject-undefined",
    visitor: {
      Program(path) {
        // Injected `export { invalid }` without defining `invalid`.
        // The invalid AST should then trigger an internal error.
        path.node.body.push(
          t.exportNamedDeclaration(
            null,
            [t.exportSpecifier(t.identifier("invalid"), t.identifier("invalid"))]
          )
        );
      }
    }
  }

  return plugin;
}
