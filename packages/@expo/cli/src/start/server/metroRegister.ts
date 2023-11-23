import path from 'path';
import fs from 'fs';
import Module from 'module';

export function registerRuntime() {
  require('@babel/register')({
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    // Don't compile node_modules.
    ignore: [],
    only: [
      // // File paths that **don't** match this regex are not compiled
      /(node_modules|packages)\/expo\/build\//,
      /(node_modules|packages)\/@expo\//,
      /(node_modules|packages)\/expo-[\w\d-_.]+\/build\//,
      /(node_modules|packages)\/expo-router\//,
      /\/node_modules\/react-native\//,
      /\/node_modules\/@react-native\//,
    ],

    // Don't cache transformations.
    cache: true,

    // Use the default babel config.
    babelrc: false,
    configFile: false,
    presets: [require.resolve('babel-preset-expo')],
    plugins: [[require('babel-plugin-transform-require-context')]],
  });

  // module-aliases.js
  // @ts-expect-error
  const originalResolveFilename = Module._resolveFilename;

  // Define your aliases here
  // TODO: Support all nested imports, e.g. react-native/package.json
  const aliases = {
    'react-native': require.resolve('react-native-web'),
    'react-native/index': require.resolve('react-native-web'),
    'react-native-vector-icons': require.resolve('@expo/vector-icons'),
  } as const;

  // @ts-expect-error
  Module._extensions['.png'] = function (module, filename) {
    // Effectively replace the import of a PNG with an empty comment or no-op
    module.exports = '// Empty Comment for PNG import';
  };

  // @ts-expect-error
  Module._resolveFilename = function (request: string, parent, isMain, options) {
    if (aliases[request]) {
      request = aliases[request];
    }

    if (request.match(/AppContainer/) && parent.id.match(/react-native-web/)) {
      request = require.resolve(
        '@expo/cli/static/shims/react-native-web/dist/exports/AppRegistry/AppContainer.js',
        {
          paths: [parent.id],
        }
      );
    }

    const baseDirectory = path.dirname(parent.filename);
    const webExtensionPath = path.join(baseDirectory, request + '.web.js');

    // Check if .web.js version exists
    if (fs.existsSync(webExtensionPath)) {
      return webExtensionPath;
    }

    return originalResolveFilename(request, parent, isMain, options);
  };

  Object.defineProperties(global, {
    __DEV__: {
      enumerable: true,
      // writable: false,
      get() {
        return process.env.NODE_ENV !== 'production';
      },
    },
  });
}
