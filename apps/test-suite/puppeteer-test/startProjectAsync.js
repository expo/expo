const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const freeportAsync = require('freeport-async');

function listenToServerAsync(host, port, server) {
  return new Promise((resolve, reject) => {
    server.listen(port, host, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function isFunction(functionToCheck) {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function evaluateConfig(methodOrObject, ...props) {
  if (isFunction(methodOrObject)) {
    return methodOrObject(...props);
  }
  return methodOrObject;
}

module.exports = async function startProjectAsync(webpackConfig) {
  const config = evaluateConfig(webpackConfig, { development: true, production: false });

  const { devServer = {} } = config;

  const options = {
    ...devServer,
    hot: true,
    inline: true,
    stats: { colors: true },
  };

  const port = await freeportAsync(8080);

  const host = 'localhost';

  try {
    const server = new WebpackDevServer(webpack(config), options);
    await listenToServerAsync(host, port, server);
    console.log('WebpackDevServer listening at localhost:', port);

    const url = `http://${host}:${port}`;

    return { server, url };
  } catch (error) {
    throw new Error('WebpackDevServer failed to start: ' + error.message);
  }
};
