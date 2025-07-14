// Based on Next.js swc taskr file.
// https://github.com/vercel/next.js/blob/5378db8f807dbb9ff0993662f0a39d0f6cba2452/packages/next/taskfile-swc.js

const { transform } = require('@swc/core');
const path = require('path');

module.exports = function (task) {
  task.plugin('swc', {}, function* (file, environment, { stripExtension } = {}) {
    // Don't compile .d.ts
    if (file.base.endsWith('.d.ts')) return;

    const setting = {
      output: 'build',
      options: {
        module: {
          type: 'commonjs',
        },
        env: {
          targets: {
            node: '22',
          },
        },
        jsc: {
          loose: true,
          parser: {
            syntax: 'typescript',
            dynamicImport: true,
          },
        },
      },
    };

    const filePath = path.join(file.dir, file.base);
    const inputFilePath = path.join(__dirname, filePath);
    const outputFilePath = path.dirname(path.join(__dirname, setting.output, filePath));

    const options = {
      filename: path.join(file.dir, file.base),
      sourceMaps: true,
      sourceFileName: path.relative(outputFilePath, inputFilePath),
      ...setting.options,
    };

    const output = yield transform(file.data.toString('utf-8'), options);
    const ext = path.extname(file.base);

    // Replace `.ts|.tsx` with `.js` in files with an extension
    if (ext) {
      const extRegex = new RegExp(ext.replace('.', '\\.') + '$', 'i');
      // Remove the extension if stripExtension is enabled or replace it with `.js`
      file.base = file.base.replace(extRegex, stripExtension ? '' : '.js');
    }

    if (output.map) {
      const map = `${file.base}.map`;

      output.code += Buffer.from(`\n//# sourceMappingURL=${map}`);

      // add sourcemap to `files` array
      this._.files.push({
        base: map,
        dir: file.dir,
        data: Buffer.from(output.map),
      });
    }

    file.data = Buffer.from(output.code);
  });
};
