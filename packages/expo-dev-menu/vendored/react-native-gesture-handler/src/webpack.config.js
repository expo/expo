const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const {
  conditionMatchesFile,
  getRules,
} = require('@expo/webpack-config/utils');
const { resolve } = require('path');
module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  // Get all rules
  const rules = getRules(config);
  // Get all JS rules
  const jsLoaders = rules.filter(
    ({ rule }) =>
      rule.test && conditionMatchesFile(rule, resolve(__dirname, 'foo.js'))
  );

  for (const loader of jsLoaders) {
    // Use custom web babel.config.js
    loader.rule.use.options = {
      ...loader.rule.use.options,
      babelrc: false,
      configFile: false,
      presets: [require.resolve('babel-preset-expo')],
      plugins: [
        [
          require.resolve('babel-plugin-module-resolver'),
          {
            alias: {
              'react-native-gesture-handler': './',
              react: './node_modules/react',
              '@egjs/hammerjs': './node_modules/@egjs/hammerjs',
              fbjs: './node_modules/fbjs',
              'hoist-non-react-statics':
                './node_modules/hoist-non-react-statics',
              invariant: './node_modules/invariant',
              'prop-types': './node_modules/prop-types',
            },
          },
        ],
      ],
    };
  }

  return config;
};
