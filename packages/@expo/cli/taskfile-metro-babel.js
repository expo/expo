const path = require('path');
const assert = require('assert');
const babel = require('@babel/core');

async function nativeBabelFlowTransform(input, options) {
  return await new Promise((res, rej) => {
    babel.transform(
      input,
      {
        babelrc: false,
        configFile: false,

        plugins: [require('babel-plugin-transform-flow-enums')],
        presets: [
          require('metro-react-native-babel-preset').getPreset(input, {}),
          //   [
          //     require('metro-react-native-babel-preset'),
          //     {
          //       //   useTransformReactJSXExperimental: false,
          //       //   disableImportExportTransform: true,
          //     },
          //   ],
        ],
        caller: {
          name: 'metro',
          platform: 'ios',
        },
        minified: false,
        compact: false,
        comments: false,
        retainLines: false,
        //   cwd: __dirname,
        babelrcRoots: false,

        ...options,
      },
      (err, result) => {
        if (!result || err) rej(err || 'no res');
        res(result);
      }
    );
  });
}

module.exports = function (task) {
  // Like `/^(cli|sdk)$/`

  task.plugin(
    'metroBabel',
    {},
    function* (file, environment, { stripExtension, platform, minify } = {}) {
      // Don't compile .d.ts
      // TODO: minify package.json
      if (['.png', '.d.ts', '.json'].some((ext) => file.base.endsWith(ext))) return;

      const filePath = path.join(file.dir, file.base);
      const inputFilePath = path.join(__dirname, filePath);
      const outputFilePath = path.dirname(path.join(__dirname, filePath));

      const options = {
        filename: path.join(file.dir, file.base),
        //   sourceMaps: true,
        sourceFileName: path.relative(outputFilePath, inputFilePath),
        //   ...setting.options,
        minified: minify,
      };

      // console.log('IN:', options.filename);
      const output = yield nativeBabelFlowTransform(file.data.toString('utf-8'), options);
      // console.log('OUT:', output);
      const ext = path.extname(file.base);

      // Replace `.ts|.tsx` with `.js` in files with an extension
      if (ext && ext !== '.js') {
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
          data: Buffer.from(JSON.stringify(output.map)),
        });
      }

      file.data = Buffer.from(output.code);
    }
  );

  task.plugin('collapsePlatformExtensions', {}, function* (file, platform, {} = {}) {
    const platforms = [platform];
    if (['ios', 'android'].includes(platform)) {
      platforms.push('native');
    }

    for (const platform of platforms) {
      const endRegex = new RegExp(`\\.${platform}\\.[jt]sx?$`, 'i');
      if (file.base.match(endRegex)) {
        file.base = file.base.replace(endRegex, '.js');
        break;
      }
    }
  });

  task.plugin('rename', {}, function* (file, name, {} = {}) {
    file.base = name;
  });
};
