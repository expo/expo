function wrapPluginMeta(plugin, packageName) {
  if (!plugin.meta) {
    plugin.meta = {
      name: packageName,
      version: require(`${packageName}/package.json`).version,
    };
  }

  return plugin;
}

function legacyPlugin(plugin) {
  return wrapPluginMeta(require(plugin), plugin);
}

module.exports = {
  legacyPlugin,
  wrapPluginMeta,
};
