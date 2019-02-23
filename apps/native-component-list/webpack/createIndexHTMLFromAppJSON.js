const HtmlWebpackPlugin = require('html-webpack-plugin');

function createIndexHTMLFromAppJSON(locations) {
  const nativeAppManifest = require(locations.appJson);

  const { expo: expoManifest = {} } = nativeAppManifest;

  const metaTags = {
    viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
    description: expoManifest.description || 'A Neat Expo App',
    'theme-color': expoManifest.primaryColor || '#000000',
    'apple-mobile-web-app-capable': 'yes',
    // default, black, black-translucent
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': expoManifest.name,
    'application-name': expoManifest.name,
    // Windows
    'msapplication-navbutton-color': '',
    'msapplication-TileColor': '',
    'msapplication-TileImage': '',
  };

  // Generates an `index.html` file with the <script> injected.
  return new HtmlWebpackPlugin({
    /**
     * The file to write the HTML to.
     * Default: `'index.html'`.
     */
    filename: locations.production.indexHtml,
    /**
     * The title to use for the generated HTML document.
     * Default: `'Webpack App'`.
     */
    title: expoManifest.name,
    /**
     * Pass a html-minifier options object to minify the output.
     * https://github.com/kangax/html-minifier#options-quick-reference
     * Default: `false`.
     */
    minify: {
      removeComments: true,
      /* Prod */
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
    /**
     * Adds the given favicon path to the output html.
     * Default: `false`.
     */
    favicon: locations.template.favicon,
    /**
     * Allows to inject meta-tags, e.g. meta: `{viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no'}`.
     * Default: `{}`.
     */
    meta: metaTags,
    /**
     * The `webpack` require path to the template.
     * @see https://github.com/jantimon/html-webpack-plugin/blob/master/docs/template-option.md
     */
    template: locations.template.indexHtml,
  });
}

module.exports = createIndexHTMLFromAppJSON;
