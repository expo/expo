'use strict';

const md5File = require('md5-file/promise');

module.exports = function hashAssetFiles(asset) {
  return Promise.all(asset.files.map(md5File)).then(hashes => {
    asset.fileHashes = hashes;
    return asset;
  });
};
