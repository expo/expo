import { transformSync } from '@babel/core';
import dedent from 'dedent';
import { minify as terser, MinifyOutput } from 'terser';

import universalPlatformPlugin, { UniversalPlatformPluginOptions } from '..';

// @ts-ignore
export function transform(input: string, options: UniversalPlatformPluginOptions): string {
  const value = transformSync(dedent(input), {
    plugins: [[universalPlatformPlugin, options]],
    babelrc: false,
    configFile: false,
  });

  const code = value == null ? '' : (value.code as string);
  return code;
}

export function compress(input: string): MinifyOutput {
  return terser(input, {
    mangle: false,
    compress: {
      dead_code: true,
    },
    output: {
      beautify: true,
    },
  });
}

export function testCompressed(input: string): string {
  const { warnings, error, code } = compress(input);
  expect(warnings).not.toBeDefined();
  expect(error).not.toBeDefined();
  expect(code).toMatchSnapshot();
  return code as string;
}
