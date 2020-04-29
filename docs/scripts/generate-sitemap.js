const { createWriteStream } = require('fs');
const path = require('path');
const { SitemapStream } = require('sitemap');

const IGNORED_PATHS = ['/404.html', '/index', '/'];

module.exports = function generateSitemap(options) {
  const urls = Object.keys(options.pathMap)
    .filter(url => !IGNORED_PATHS.includes(url))
    .map(getPathWithTrailingSlash);

  const output = createWriteStream(options.output);
  const sitemap = new SitemapStream({
    hostname: options.hostname,
    xmlns: {
      news: false,
      xhtml: false,
      image: false,
      video: false,
    },
  });

  sitemap.pipe(output);
  sitemap.write({ url: '/' });
  urls.forEach(url => sitemap.write({ url }));
  sitemap.end();
}

function getPathWithTrailingSlash(url) {
  return !path.extname(url) && !url.endsWith('/') ? `${url}/` : url;
}
