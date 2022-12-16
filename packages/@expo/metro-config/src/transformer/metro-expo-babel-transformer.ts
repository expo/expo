// Copyright 2021-present 650 Industries (Expo). All rights reserved.

import resolveFrom from 'resolve-from';

import { getCacheKey } from './getCacheKey';

let transformer: any = null;

function resolveTransformer(projectRoot: string) {
  if (transformer) {
    return transformer;
  }
  const resolvedPath = resolveFrom.silent(projectRoot, 'metro-react-native-babel-transformer');
  if (!resolvedPath) {
    throw new Error(
      'Missing package "metro-react-native-babel-transformer" in the project. ' +
        'This usually means `react-native` is not installed. ' +
        'Please verify that dependencies in package.json include "react-native" ' +
        'and run `yarn` or `npm install`.'
    );
  }
  transformer = require(resolvedPath);
  return transformer;
}

/**
 * Extends the default `metro-react-native-babel-transformer`
 * and uses babel-preset-expo as the default instead of metro-react-native-babel-preset.
 * This enables users to safely transpile an Expo project without
 * needing to explicitly define a `babel.config.js`
 *
 * @param filename string
 * @param options BabelTransformerOptions
 * @param plugins $PropertyType<BabelCoreOptions, 'plugins'>
 * @param src string
 *
 * @returns
 */
function transform(props: {
  filename: string;
  options: Record<string, any> & { projectRoot: string };
  plugins?: unknown;
  src: string;
}) {
  // Use babel-preset-expo by default if available...
  props.options.extendsBabelConfigPath = resolveFrom.silent(
    props.options.projectRoot,
    'babel-preset-expo'
  );
  return resolveTransformer(props.options.projectRoot).transform(props);
}

module.exports = {
  getCacheKey,
  transform,
};
