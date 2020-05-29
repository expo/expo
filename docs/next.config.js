const { copySync, removeSync } = require('fs-extra');
const { join } = require('path');

// copy versions/v(latest version) to versions/latest
// (Next.js only half-handles symlinks)
const vLatest = join('pages', 'versions', `v${require('./package.json').version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);

module.exports = {
  // Rather than use `@zeit/next-mdx`, we replicate it
  pageExtensions: ['js', 'jsx', 'md', 'mdx'],
  webpack: (config, options) => {
    config.module.rules.push({
      test: /.mdx?$/, // load both .md and .mdx files
      use: [options.defaultLoaders.babel, '@mdx-js/loader', join(__dirname, './common/md-loader')],
    });
    return config;
  },
  // To support visiting URLs of the form /x/, our S3 configuration assumes that x.js will generate
  // out/x/index.html instead of out/x.html
  exportTrailingSlash: true,
  async exportPathMap(defaultPathMap, { dev, dir, outDir }) {
    if (dev) {
      return defaultPathMap;
    }

    copySync(join(dir, 'robots.txt'), join(outDir, 'robots.txt'));
    return defaultPathMap;
  },
};
