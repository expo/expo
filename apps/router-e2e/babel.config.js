const styleXPlugin = require('@stylexjs/babel-plugin');

module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  if (process.env.E2E_ROUTER_SRC === 'headless') {
    plugins.push([
      styleXPlugin,
      {
        importSources: [{ from: 'react-strict-dom', as: 'css ' }],
        dev: process.env.NODE_ENV === 'development',
        // unstable_moduleResolution: {
        //   type: 'commonJS',
        //   rootDir: __dirname + '/__e2e__/headless',
        // },
      },
    ]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
