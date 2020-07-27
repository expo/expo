const { loadAsync } = require('@expo/metro-config');
const Server = require('metro/src/Server');

async function fetchAssetManifestAsync(platform, projectRoot) {
  const config = await loadAsync(projectRoot);
  const server = new Server(config);

  const requestOpts = {
    entryFile: process.env.ENTRY_FILE || 'index.js',
    dev: false,
    minify: false,
    platform,
  };

  let assetManifest;
  let error;
  try {
    assetManifest = await server.getAssets({
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
    });
  } catch (e) {
    error = e;
  } finally {
    server.end();
  }

  if (error) {
    throw error;
  }

  return assetManifest;
}

module.exports = fetchAssetManifestAsync;
