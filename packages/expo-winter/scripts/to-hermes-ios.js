const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
// const { buildHermesBundleAsync } = require('@expo/dev-server/build/HermesBundler');
const { buildHermesBundleAsync } = require('@expo/cli/build/src/export/exportHermes');

(async () => {
  const platform = 'ios';
  const projectRoot = path.dirname(__dirname);
  const hbcPath = path.join(projectRoot, platform, 'hbc');
  // glob all js files in a folder.
  const moduleFiles = glob.sync('**/*.js', {
    // absolute: true,
    cwd: path.join(projectRoot, platform, 'js'),
  });

  await fs.promises.rm(hbcPath, { recursive: true, force: true });

  for await (const moduleFile of moduleFiles) {
    const inputModuleFile = path.join(projectRoot, platform, 'js', moduleFile);
    const outputModuleFile = path
      .join(
        hbcPath,
        (moduleFile.startsWith('_') ? '' : 'zz_') +
          moduleFile.replace(/\//g, '_').replace(/@/g, '_')
      )
      .replace('.js', '.hbc');

    console.log('Bundling:', inputModuleFile);
    let code = await fs.promises.readFile(inputModuleFile, 'utf8');

    const out = await buildHermesBundleAsync(projectRoot, {
      code,
      map: JSON.stringify({
        version: 3,
        file: 'xxx.js',
        names: [],
        sources: [],
        sourcesContent: [],
        mappings: '',
      }),
      minify: true,
    });
    const output = outputModuleFile;
    await fs.promises.mkdir(path.dirname(output), { recursive: true });
    console.log('Writing:', output);
    fs.writeFileSync(output, out.hbc);
  }
})();
