import chalk from 'chalk';

import { TransformPipeline } from '.';

export function injectMacros(versionName: string): TransformPipeline {
  return {
    logHeader(filePath: string) {
      console.log(`Injecting macros at ${chalk.magenta(filePath)}:`);
    },
    transforms: [
      {
        // add a macro ABIXX_0_0EX_REMOVE_VERSION(str) to RCTDefines
        paths: 'RCTDefines.h',
        replace: /(.|\s)$/,
        with: `$1\n#define ${versionName}EX_REMOVE_VERSION(string) (([string hasPrefix:@"${versionName}"]) ? [string stringByReplacingCharactersInRange:(NSRange){0,@"${versionName}".length} withString:@""] : string)\n`,
      },
      {
        // use the macro on the return value of `RCTBridgeModuleNameForClass`
        // to pass unversioned native module names to JS
        paths: 'RCTBridge.m',
        replace: /(return ABI\d+_\d+_\d+RCTDropABI\d+_\d+_\d+ReactPrefixes)\(name\)/g,
        with: `$1(${versionName}EX_REMOVE_VERSION(name))`,
      },
      {
        // use the macro on the return value of `moduleNameForClass`
        // to pass unversioned native module names to JS
        paths: 'RCTComponentData.m',
        replace: /(if \(\[name hasPrefix:@"RK"\]\) \{\n)/g,
        with: `name = ${versionName}EX_REMOVE_VERSION(name);\n  $1`,
      },
      {
        // injects macro into `enqueueJSCall:method:args:completion:` method of RCTCxxBridge
        paths: 'RCTCxxBridge.mm',
        replace: /callJSFunction(\s*?\(\s*?)\[module UTF8String\],/,
        with: `callJSFunction$1[${versionName}EX_REMOVE_VERSION(module) UTF8String],`,
      },
      {
        // now that this code is versioned, remove meaningless EX_UNVERSIONED declaration
        paths: ['EXUnversioned.h', 'EXServerRegistrationModule.m'],
        replace: /(#define symbol[.\S\s]+?(?=\n\n)\n\n)/g,
        with: '\n',
      },
    ],
  };
}
