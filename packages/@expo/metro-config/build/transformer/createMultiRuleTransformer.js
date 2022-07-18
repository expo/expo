"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMultiRuleTransformer = createMultiRuleTransformer;
exports.loaders = void 0;

function _chalk() {
  const data = _interopRequireDefault(require("chalk"));

  _chalk = function () {
    return data;
  };

  return data;
}

function _debug() {
  const data = _interopRequireDefault(require("debug"));

  _debug = function () {
    return data;
  };

  return data;
}

function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));

  _resolveFrom = function () {
    return data;
  };

  return data;
}

function _generateFunctionMap() {
  const data = require("./generateFunctionMap");

  _generateFunctionMap = function () {
    return data;
  };

  return data;
}

function _getBabelConfig() {
  const data = require("./getBabelConfig");

  _getBabelConfig = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright 2021-present 650 Industries (Expo). All rights reserved.
const debug = (0, _debug().default)('expo:metro:exotic-babel-transformer');
let babelCore;

function getBabelCoreFromProject(projectRoot) {
  if (babelCore) return babelCore;
  babelCore = require((0, _resolveFrom().default)(projectRoot, '@babel/core'));
  return babelCore;
}

let babelParser;

function getBabelParserFromProject(projectRoot) {
  if (babelParser) return babelParser;
  babelParser = require((0, _resolveFrom().default)(projectRoot, '@babel/parser'));
  return babelParser;
}

function sucrase(args, {
  transforms
}) {
  const {
    src,
    filename,
    options: {
      dev
    }
  } = args;

  const {
    transform
  } = require('sucrase');

  const results = transform(src, {
    filePath: filename,
    production: !dev,
    transforms
  });
  return {
    code: results.code,
    functionMap: null
  };
}

const getExpensiveSucraseTransforms = filename => ['jsx', 'imports', /\.tsx?$/.test(filename) ? 'typescript' : 'flow'];

function parseAst(projectRoot, sourceCode) {
  const babylon = getBabelParserFromProject(projectRoot);
  return babylon.parse(sourceCode, {
    sourceType: 'unambiguous'
  });
}

/** Create a transformer that emulates Webpack's loader system. */
function createMultiRuleTransformer({
  getRuleType,
  rules
}) {
  // const warnings: string[] = [];
  return function transform(args) {
    const {
      filename,
      options
    } = args;
    const OLD_BABEL_ENV = process.env.BABEL_ENV;
    process.env.BABEL_ENV = options !== null && options !== void 0 && options.dev ? 'development' : process.env.BABEL_ENV || 'production';

    try {
      const ruleType = getRuleType(args);

      for (const rule of rules) {
        // optimization for checking node modules
        if (rule.type && rule.type !== ruleType) {
          continue;
        }

        const isMatched = typeof rule.test === 'function' ? rule.test(args) : rule.test.test(args.filename);

        if (isMatched) {
          const results = rule.transform(args); // @ts-ignore: Add extra property for testing

          results._ruleName = rule.name; // Perform a basic parse if none exists, this enables us to control the output, but only if it changed.

          if (results.code && !results.ast) {
            // Parse AST with babel otherwise Metro transformer will throw away the returned results.
            results.ast = parseAst(options === null || options === void 0 ? void 0 : options.projectRoot, results.code);
          } // TODO: Suboptimal warnings
          // if (rule.warn) {
          //   const matchName =
          //     filename.match(/node_modules\/((:?@[\w\d-]+\/[\w\d-]+)|(:?[\w\d-]+))\/?/)?.[1] ??
          //     filename;
          //   if (matchName && !warnings.includes(matchName)) {
          //     warnings.push(matchName);
          //     console.warn(chalk.yellow.bold`warn `, matchName);
          //     console.warn(
          //       chalk.yellow`untranspiled module is potentially causing bundler slowdown, using modules that support commonjs will make your dev server much faster.`
          //     );
          //   }
          // }


          return results;
        }
      }

      throw new Error('no loader rule to handle file: ' + filename);
    } finally {
      if (OLD_BABEL_ENV) {
        process.env.BABEL_ENV = OLD_BABEL_ENV;
      }
    }
  };
}

const loaders = {
  // Perform the standard, and most expensive transpilation sequence.
  app(args) {
    debug('app:', args.filename);
    const {
      filename,
      options,
      src,
      plugins
    } = args;
    const babelConfig = {
      // ES modules require sourceType='module' but OSS may not always want that
      sourceType: 'unambiguous',
      ...(0, _getBabelConfig().getBabelConfig)(filename, options, plugins),
      // Variables that are exposed to the user's babel preset.
      caller: {
        name: 'metro',
        platform: options.platform
      },
      ast: true
    }; // Surface a warning function so babel linters can be used.

    Object.defineProperty(babelConfig.caller, 'onWarning', {
      enumerable: false,
      writable: false,
      value: babelConfig.caller.onWarning = function (msg) {
        // Format the file path first so users know where the warning came from.
        console.warn(_chalk().default.bold.yellow`warn ` + args.filename);
        console.warn(msg);
      }
    });
    const {
      parseSync,
      transformFromAstSync
    } = getBabelCoreFromProject(options.projectRoot);
    const sourceAst = parseSync(src, babelConfig); // Should never happen.

    if (!sourceAst) return {
      ast: null
    };
    const result = transformFromAstSync(sourceAst, src, babelConfig); // TODO: Disable by default

    const functionMap = (0, _generateFunctionMap().generateFunctionMap)(options.projectRoot, sourceAst, {
      filename
    }); // The result from `transformFromAstSync` can be null (if the file is ignored)

    if (!result) {
      return {
        ast: null,
        functionMap
      };
    }

    return {
      ast: result.ast,
      functionMap
    };
  },

  // Transpile react-native with sucrase.
  reactNativeModule(args) {
    debug('rn:', args.filename);
    return sucrase(args, {
      transforms: ['jsx', 'flow', 'imports']
    });
  },

  // Transpile expo modules with sucrase.
  expoModule(args) {
    debug('expo:', args.filename); // TODO: Fix all expo packages

    return sucrase(args, {
      transforms: ['imports', // TODO: fix expo-processing, expo/vector-icons
      /(expo-processing|expo\/vector-icons)/.test(args.filename) && 'jsx', // TODO: fix expo-asset-utils
      /(expo-asset-utils)/.test(args.filename) && 'flow'].filter(Boolean)
    });
  },

  // Transpile known community modules with the most expensive sucrase
  untranspiledModule(args) {
    debug('known issues:', args.filename);
    return sucrase(args, {
      transforms: getExpensiveSucraseTransforms(args.filename)
    });
  },

  // Pass all modules through without transpiling them.
  passthroughModule(args) {
    const {
      filename,
      options,
      src
    } = args;
    debug('passthrough:', filename); // Perform a basic ast parse, this doesn't matter since the worker will parse and ignore anyways.

    const ast = parseAst(options.projectRoot, src); // TODO: Disable by default

    const functionMap = (0, _generateFunctionMap().generateFunctionMap)(options.projectRoot, ast, {
      filename
    });
    return {
      code: src,
      functionMap,
      ast
    };
  }

};
exports.loaders = loaders;
//# sourceMappingURL=createMultiRuleTransformer.js.map