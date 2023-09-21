// eslint-disable-next-line import/no-extraneous-dependencies
const findUp = require('find-up');
// eslint-disable-next-line import/no-extraneous-dependencies
const ncc = require('@vercel/ncc');
const { existsSync, readFileSync } = require('fs');
const { basename, dirname, extname, join, resolve } = require('path');
const { Module } = require('module');

// See taskfile.js bundleContext definition for explanation
// const m = new Module(resolve(__dirname, 'bundles', '_'))
// m.filename = m.id
// m.paths = Module._nodeModulePaths(m.id)
// const bundleRequire = m.require
// bundleRequire.resolve = (request, options) =>
//   Module._resolveFilename(request, m, false, options)

module.exports = function (task) {
  // eslint-disable-next-line require-yield
  task.plugin('ncc', {}, function* (file, options) {
    if (options.externals && options.packageName) {
      options.externals = { ...options.externals };
      delete options.externals[options.packageName];
    }
    let precompiled = options.precompiled !== false;
    delete options.precompiled;

    return ncc(join(__dirname, file.dir, file.base), {
      filename: file.base,
      minify: false, //options.minify === false ? false : true,
      assetBuilds: true,
      ...options,
    }).then(({ code, assets }) => {
      Object.keys(assets).forEach((key) => {
        let data = assets[key].source;

        this._.files.push({
          data,
          base: basename(key),
          dir: join(file.dir, dirname(key)),
        });
      });

      file.data = Buffer.from(
        // Strip __dirname from webpack resolution.
        code.replace('__dirname', JSON.stringify('')),
        'utf8'
      );
    });
  });
};
