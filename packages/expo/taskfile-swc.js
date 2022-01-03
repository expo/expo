// Based on Next.js swc taskr file.
// https://github.com/vercel/next.js/blob/5378db8f807dbb9ff0993662f0a39d0f6cba2452/packages/next/taskfile-swc.js

const path = require('path');

const transform = require('@swc/core').transform;

module.exports = function (task) {
  task.plugin('swc', {}, function* (file, serverOrClient, { stripExtension, dev } = {}) {
    // Don't compile .d.ts
    if (file.base.endsWith('.d.ts')) return;

    const isClient = serverOrClient === 'client';

    const swcClientOptions = {
      module: {
        type: 'es6',
      },
      jsc: {
        loose: true,

        target: 'es2016',
        parser: {
          syntax: 'typescript',
          dynamicImport: true,
          tsx: file.base.endsWith('.tsx'),
        },
        transform: {
          react: {
            pragma: 'React.createElement',
            pragmaFrag: 'React.Fragment',
            throwIfNamespace: true,
            development: false,
            useBuiltins: true,
          },
        },
      },
    };

    const swcServerOptions = {
      module: {
        type: 'commonjs',
      },
      env: {
        targets: {
          node: '12.0.0',
        },
      },
      jsc: {
        loose: true,

        parser: {
          syntax: 'typescript',
          dynamicImport: true,
          tsx: file.base.endsWith('.tsx'),
        },
        transform: {
          react: {
            pragma: 'React.createElement',
            pragmaFrag: 'React.Fragment',
            throwIfNamespace: true,
            development: false,
            useBuiltins: true,
          },
        },
      },
    };

    const swcOptions = isClient ? swcClientOptions : swcServerOptions;

    const filePath = path.join(file.dir, file.base);
    const fullFilePath = path.join(__dirname, filePath);
    const distFilePath = path.dirname(path.join(__dirname, isClient ? 'build' : 'dist', filePath));

    const options = {
      filename: path.join(file.dir, file.base),
      sourceMaps: true,
      sourceFileName: path.relative(distFilePath, fullFilePath),

      ...swcOptions,
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

    file.data = Buffer.from(setVersionCode(output.code));
  });
};

function setVersionCode(code) {
  return code.replace(/process\.env\.__EXPO_VERSION/g, `"${require('./package.json').version}"`);
}
