#!/usr/bin/env node
import * as fs from 'fs';
import * as babel from '@babel/core';

function main(): void {
  const sampleFile = process.argv[2] || 'sample.tsx';
  console.log(
    `Profiling babel-preset-expo on ${sampleFile}. Make sure you have Chrome DevTools for Node open.`
  );
  const code = fs.readFileSync(`./benchmark/sample/${sampleFile}`).toString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console as any).profile('babel-preset-expo');
  for (let i = 0; i < 100; i++) {
    const babelConfig = {
      filename: sampleFile.endsWith('.ts') ? 'sample.ts' : 'sample.tsx',
      presets: [require('../build')],
      caller: {
        name: 'metro',
        platform: 'ios',
        isServer: false,
      },
    };
    babel.transformSync(code, babelConfig)?.code;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console as any).profileEnd('babel-preset-expo');
}

main();
