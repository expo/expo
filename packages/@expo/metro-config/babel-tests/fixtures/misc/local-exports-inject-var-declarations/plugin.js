/**
 * local-exports-inject-var-declarations plugin
 * @param {import("@babel/core").PluginAPI} api
 * @returns
 */
module.exports = function(api) {
  const { types: t } = api;
  /**
   * @type {import("@babel/core").PluginObject}
   */
  const plugin = {
    name: "local-exports-inject-var-declarations",
    visitor: {
      Program(path) {
        path.node.body.push(
          t.exportNamedDeclaration(
            null,
            [t.exportSpecifier(t.identifier("injected"), t.identifier("injected"))]
          ),
          t.variableDeclaration(
            "var",
            [t.variableDeclarator(t.identifier("injected"))]
          )
        );
      }
    }
  }

  return plugin;
}
