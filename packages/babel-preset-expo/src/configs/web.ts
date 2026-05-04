import type { ConfigAPI, PluginItem } from '@babel/core';

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

export interface WebConfigOptions {
  dev?: boolean;
}

/** Preset that's used for the Web target */
module.exports = function (_api: ConfigAPI, _options: WebConfigOptions) {
  return {
    comments: false,
    compact: true,
    plugins: [
      [require('@babel/plugin-transform-class-static-block'), { loose }],
      [require('@babel/plugin-transform-private-methods'), { loose }],
      [require('@babel/plugin-transform-private-property-in-object'), { loose }],
    ] as PluginItem[],
  };
};
