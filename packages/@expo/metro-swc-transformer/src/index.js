/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { existsSync } = require('fs');
const { join } = require('path');
const countLines = require('metro/src/lib/countLines');

if (existsSync(join(__dirname, 'metro-swc-transformer-addon.node'))) {
  throw new Error('Node.js addon for metro-swc-transformer not found');
}

// export {default} from './metro-swc-transformer-addon';

const { transform } = require('../metro-swc-transformer-addon.node');
module.exports.transform = (config, projectRoot, filename, data, options) => {
  const out = transform({
    code: data,
    fileName: filename,
    globalPrefix: config.globalPrefix,
  });
  out.code = `/* swc */ ` + out.code.trim();
  // console.log('o', out);
  return {
    dependencies: Object.entries(out.dependencies)
      .sort(([, a], [, b]) => a.index - b.index)
      .reduce((acc, [key, value]) => {
        return [
          ...acc,
          {
            /**
             * The literal name provided to a require or import call. For example 'foo' in
             * case of `require('foo')`.
             */
            name: key,

            /**
             * Extra data returned by the dependency extractor.
             */
            data: {
              /**
               * A locally unique key for this dependency within the current module.
               */
              key: key,
              /**
               * If not null, this dependency is due to a dynamic `import()` or `__prefetchImport()` call.
               */
              asyncType: null,
              // asyncType: AsyncDependencyType | null;

              /**
               * The condition for splitting on this dependency edge.
               */
              // splitCondition?: {
              //   mobileConfigName: string;
              // };
              /**
               * The dependency is enclosed in a try/catch block.
               */
              isOptional: out.optionalDependencies.includes(key),

              // locs: $ReadOnlyArray<BabelSourceLocation>;

              /** Context for requiring a collection of modules. */
              // contextParams?: RequireContextParams;
            },
          },
        ];
      }, []),
    output: [
      {
        type: 'js/module',
        data: {
          code: out.code,
          lineCount: countLines(out.code),
          // map: out.map,
          functionMap: null,
        },
      },
    ],
  };
};
