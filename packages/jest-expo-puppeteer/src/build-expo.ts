const process = require('process');
const path = require('path');

const { Webpack } = require('@expo/xdl');

async function main(args) {
  const projectRoot = path.resolve(args[0]);
  console.log('Building', projectRoot);
  try {
    await Webpack.bundleAsync(projectRoot, {
      nonInteractive: true,
      verbose: true,
      mode: 'production',
      webpackEnv: {
        removeUnusedImportExports: true,
      },
    });
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
