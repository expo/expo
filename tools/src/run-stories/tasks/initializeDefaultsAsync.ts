import fs from 'fs';
import path from 'path';

import { getPackageRoot, getProjectRoot } from '../helpers';

export async function initializeDefaultsAsync(packageName: string) {
  const packageRoot = getPackageRoot(packageName);

  const pkg = require(path.resolve(packageRoot, 'package.json'));

  let shouldWritePkg = false;

  // add et start script
  if (!pkg.scripts['start:examples']) {
    shouldWritePkg = true;
    pkg.scripts['start:examples'] = 'et run-stories';
  }

  if (shouldWritePkg) {
    fs.writeFileSync(path.resolve(packageRoot, 'package.json'), JSON.stringify(pkg, null, 2), {
      encoding: 'utf-8',
    });
  }

  const tsconfigFile = fs.readFileSync(path.resolve(packageRoot, 'tsconfig.json'), {
    encoding: 'utf-8',
  });

  try {
    const lines = tsconfigFile.split(/\r?\n/);
    const [generatedComment, ...json] = lines;

    const tsconfig = JSON.parse(json.join('\n'));

    let shouldWriteTsConfig = false;

    if (!tsconfig.exclude.includes('**/__stories__/*')) {
      shouldWriteTsConfig = true;
      tsconfig.exclude.push('**/__stories__/*');
    }

    if (shouldWriteTsConfig) {
      const tsconfigAsString = JSON.stringify(tsconfig, null, 2);
      const updatedFile = generatedComment + '\n' + tsconfigAsString;

      fs.writeFileSync(path.resolve(packageRoot, 'tsconfig.json'), updatedFile, {
        encoding: 'utf-8',
      });
    }
  } catch (e) {
    console.log({ e });
  }

  if (!fs.existsSync(path.resolve(packageRoot, 'src', '__stories__'))) {
    fs.mkdirSync(path.resolve(packageRoot, 'src', '__stories__'));

    const projectRoot = getProjectRoot(packageName);
    const templateDir = path.resolve(
      projectRoot,
      '../../template-files/stories-templates/defaultStory.js'
    );

    fs.copyFileSync(
      templateDir,
      path.resolve(packageRoot, 'src', '__stories__', 'DefaultStory.stories.tsx')
    );
  }
}
