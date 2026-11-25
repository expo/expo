import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { RuleTester } from 'oxlint/plugins-dev';

import rule from './no-platform-variant-exports.js';

RuleTester.describe = describe;
RuleTester.it = it;

const root = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'no-platform-variant-exports-'))
);
after(() => fs.rmSync(root, { recursive: true, force: true }));

function write(files) {
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, typeof content === 'string' ? content : JSON.stringify(content));
  }
}

write({
  'app/package.json': { name: 'app' },
  'app/Image.tsx': '',
  'app/Image.web.tsx': '',

  // The "exports" target has a platform file.
  'app/node_modules/exact-export/package.json': {
    name: 'exact-export',
    exports: { '.': './src/Image.tsx', './head': './src/ExpoHead.js' },
  },
  'app/node_modules/exact-export/src/Image.tsx': '',
  'app/node_modules/exact-export/src/Image.web.tsx': '',
  'app/node_modules/exact-export/src/ExpoHead.js': '',
  'app/node_modules/exact-export/src/ExpoHead.ios.js': '',
  'app/node_modules/exact-export/src/ExpoHead.android.js': '',

  // The "exports" target is a barrel file. The barrel file has no platform file.
  'app/node_modules/barrel-export/package.json': {
    name: 'barrel-export',
    exports: { '.': './src/index.ts' },
  },
  'app/node_modules/barrel-export/src/index.ts': '',
  'app/node_modules/barrel-export/src/Image.tsx': '',
  'app/node_modules/barrel-export/src/Image.web.tsx': '',

  // Each platform has a condition that selects its file.
  'app/node_modules/condition-export/package.json': {
    name: 'condition-export',
    exports: { '.': { 'react-native': './index.native.js', default: './index.js' } },
  },
  'app/node_modules/condition-export/index.js': '',
  'app/node_modules/condition-export/index.native.js': '',

  'app/node_modules/exact-main/package.json': { name: 'exact-main', main: './index.js' },
  'app/node_modules/exact-main/index.js': '',
  'app/node_modules/exact-main/index.native.js': '',

  'app/node_modules/platform-main/package.json': { name: 'platform-main', main: './index' },
  'app/node_modules/platform-main/index.js': '',
  'app/node_modules/platform-main/index.native.js': '',
});

const filename = path.join(root, 'app/index.tsx');
const cwd = path.join(root, 'app');
const exportsPath = path.join('node_modules', 'exact-export', 'src');

new RuleTester({ cwd }).run('metro/no-platform-variant-exports', rule, {
  valid: [
    { filename, code: `import './Image';` },
    { filename, code: `import 'barrel-export';` },
    { filename, code: `import 'condition-export';` },
    { filename, code: `import 'platform-main';` },
    { filename, code: `import type { Image } from 'exact-export';` },
    { filename, code: `import 'not-installed';` },
    { filename, code: `import 'node:fs';` },
  ],
  invalid: [
    {
      filename,
      code: `import { Image } from 'exact-export';`,
      errors: [
        {
          messageId: 'ignoredVariant',
          data: {
            specifier: 'exact-export',
            resolved: path.join(exportsPath, 'Image.tsx'),
            name: 'Image',
            variants: '"Image.web.tsx"',
          },
        },
      ],
    },
    {
      filename,
      code: `export * from 'exact-export/head';`,
      errors: [
        {
          messageId: 'ignoredVariant',
          data: {
            specifier: 'exact-export/head',
            resolved: path.join(exportsPath, 'ExpoHead.js'),
            name: 'ExpoHead',
            variants: '"ExpoHead.ios.js", "ExpoHead.android.js"',
          },
        },
      ],
    },
    { filename, code: `const image = require('exact-export');`, errors: 1 },
    { filename, code: `const image = import('exact-export');`, errors: 1 },
    {
      filename,
      code: `import 'exact-main';`,
      errors: [
        {
          messageId: 'ignoredVariant',
          data: {
            specifier: 'exact-main',
            resolved: path.join('node_modules', 'exact-main', 'index.js'),
            name: 'index',
            variants: '"index.native.js"',
          },
        },
      ],
    },
    {
      filename,
      code: `import './Image.tsx';`,
      errors: [
        {
          messageId: 'ignoredVariant',
          data: {
            specifier: './Image.tsx',
            resolved: 'Image.tsx',
            name: 'Image',
            variants: '"Image.web.tsx"',
          },
        },
      ],
    },
  ],
});
