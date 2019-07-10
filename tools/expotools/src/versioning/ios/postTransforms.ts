import chalk from 'chalk';

interface TransformConfig {
  input: string;
  versionPrefix: string;
}

interface TransformPattern {
  paths: string | string[];
  replace: RegExp | string;
  with: string;
}

const transformFunctions = [
  // TODO: move previous transforming steps here as well
  injectMacros,
  postTransforms,
];

function injectMacros({ versionPrefix }: TransformConfig): TransformPattern[] {
  return [
    {
      // add a macro ABIXX_0_0EX_REMOVE_VERSION(str) to RCTDefines
      paths: 'RCTDefines.h',
      replace: /(.|\s)$/,
      with: `$1\n#define ${versionPrefix}EX_REMOVE_VERSION(string) (([string hasPrefix:@"${versionPrefix}"]) ? [string stringByReplacingCharactersInRange:(NSRange){0,@"${versionPrefix}".length} withString:@""] : string)\n`,
    },
    {
      // use the macro on the return value of `RCTBridgeModuleNameForClass`
      // to pass unversioned native module names to JS
      paths: 'RCTBridge.m',
      replace: /(return ABI\d+_\d+_\d+RCTDropReactABI\d+_\d+_\d+Prefixes)\(name\)/g,
      with: `$1(${versionPrefix}EX_REMOVE_VERSION(name))`,
    },
    {
      // use the macro on the return value of `moduleNameForClass`
      // to pass unversioned native module names to JS
      paths: 'RCTComponentData.m',
      replace: /(if \(\[name hasPrefix:@"RK"\]\) \{\n)/g,
      with: `name = ${versionPrefix}EX_REMOVE_VERSION(name);\n  $1`,
    },
    {
      // injects macro into `enqueueJSCall:method:args:completion:` method of RCTCxxBridge
      paths: 'RCTCxxBridge.mm',
      replace: /callJSFunction\(\[module UTF8String\],/,
      with: `callJSFunction([${versionPrefix}EX_REMOVE_VERSION(module) UTF8String],`,
    },
    {
      // now that this code is versioned, remove meaningless EX_UNVERSIONED declaration
      paths: 'EXUnversioned.h',
      replace: /(#define symbol[.\S\s]+?(?=\n\n)\n\n)/g,
      with: '\n',
    },
  ]
}

function postTransforms({ versionPrefix }: TransformConfig): TransformPattern[] {
  return [
    // react-native
    {
      paths: ['RCTRedBox.m', 'RCTLog.mm'],
      replace: /#if (ABI\d+_\d+_\d+)RCT_DEBUG/g,
      with: '#if $1RCT_DEV',
    },
    {
      paths: ['NSTextStorage+FontScaling.h', 'NSTextStorage+FontScaling.m'],
      replace: /NSTextStorage \(FontScaling\)/,
      with: `NSTextStorage (${versionPrefix}FontScaling)`,
    },
    {
      paths: ['NSTextStorage+FontScaling.h', 'NSTextStorage+FontScaling.m', 'RCTTextShadowView.m'],
      replace: /\b(scaleFontSizeToFitSize|scaleFontSizeWithRatio|compareToSize)\b/g,
      with: `${versionPrefix.toLowerCase()}_rct_$1`,
    },
    {
      paths: 'RCTWebView.m',
      replace: /@"ReactABI\d+_\d+_\d+-js-navigation"/,
      with: '@"react-js-navigation"',
    },

    // Universal modules
    {
      paths: `UniversalModules/${versionPrefix}EXScoped`,
      replace: /(EXScopedReactABI\d+_\d+_\d+Native)/g,
      with: 'EXScopedReactNative',
    },

    // react-native-maps
    {
      paths: 'AIRMapWMSTile',
      replace: /\b(TileOverlay)\b/g,
      with: `${versionPrefix}$1`,
    },
    {
      paths: 'AIRGoogleMapWMSTile',
      replace: /\b(WMSTileOverlay)\b/g,
      with: `${versionPrefix}$1`,
    },

    // react-native-svg
    {
      paths: 'RNSVGRenderable.m',
      replace: /\b(saturate)\(/g,
      with: `${versionPrefix}$1(`,
    },
    {
      paths: 'RNSVGPainter.m',
      replace: /\b(PatternFunction)\b/g,
      with: `${versionPrefix}$1`,
    },

    // react-native-webview
    {
      paths: 'RNCWKWebView.m',
      replace: new RegExp(`#import "${versionPrefix}objc/runtime\\.h"`, ''),
      with: '#import "objc/runtime.h"',
    },
    {
      paths: 'RNCWKWebView.m',
      replace: /\b(_SwizzleHelperWK)\b/g,
      with: `${versionPrefix}$1`,
    },
    {
      // see issue: https://github.com/expo/expo/issues/4463
      paths: 'RNCWKWebView.m',
      replace: /MessageHandlerName = @"ReactABI\d+_\d+_\d+NativeWebView";/,
      with: `MessageHandlerName = @"ReactNativeWebView";`,
    },

    // react-native-reanimated
    {
      paths: 'REATransitionAnimation.m',
      replace: /(SimAnimationDragCoefficient)\(/g,
      with: `${versionPrefix}$1(`
    },
  ];
}

async function runTransformPipelineIOSAsync({ targetPath, input, versionPrefix }) {
  let output = input;
  const matches: { value: string, line: number, replacedWith: string }[] = [];

  for (const transformFunction of transformFunctions) {
    const result = await transformFunction({ input: output, versionPrefix });

    if (Array.isArray(result)) {
      result
        .filter(transform => pathMatchesTransformPaths(targetPath, transform.paths))
        .forEach(transform => {
          const newOutput = output.replace(transform.replace, transform.with);

          if (newOutput.length !== output.length || newOutput !== output) {
            const regExpCaptures = copyRegExpCaptures();

            matches.push({
              value: RegExp.lastMatch,
              line: (RegExp as unknown as { leftContext: string }).leftContext.split(/\n/g).length,
              replacedWith: transform.with.replace(/\$[1-9]/g, m => regExpCaptures[m]),
            });
            output = newOutput;
          }
        });
    } else if (typeof result === 'string') {
      output = result;
    }
  }

  if (matches.length > 0) {
    console.log(`Post-transforming ${chalk.yellow(targetPath)}:`);

    for (const match of matches) {
      console.log(
        `${chalk.gray(String(match.line))}:`,
        chalk.blue(match.value.trimRight()),
        chalk.red('->'),
        chalk.green(match.replacedWith.trimRight()),
      );
    }
    console.log();
  }

  return output;
}

function pathMatchesTransformPaths(path: string, transformPaths: string | string[]): boolean {
  if (typeof transformPaths === 'string') {
    return path.includes(transformPaths);
  }
  if (Array.isArray(transformPaths)) {
    return transformPaths.some(transformPath => path.includes(transformPath));
  }
  return false;
}

type RegExpCapturesKeys = '$1' | '$2' | '$3' | '$4' | '$5' | '$6' | '$7' | '$8' | '$9';
type RegExpCaptures = { [key in RegExpCapturesKeys]?: string };

// Copies `$1`-`$9` fields from RegExp as they would be overwritten by `replace` function where we use these captures.
function copyRegExpCaptures(): RegExpCaptures {
  return Array(9).fill(0).map((value, index) => `$${index + 1}`).reduce((acc, key) => {
    acc[key] = RegExp[key];
    return acc;
  }, {});
}

export {
  runTransformPipelineIOSAsync,
};
