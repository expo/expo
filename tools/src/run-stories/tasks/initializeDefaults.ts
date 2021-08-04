import fs from 'fs';
import path from 'path';

import Logger from '../../Logger';
import { getPackageRoot, getProjectRoot } from '../helpers';

export function initializeDefaults(packageName: string) {
  const packageRoot = getPackageRoot(packageName);

  const pkg = require(path.resolve(packageRoot, 'package.json'));

  if (!pkg.expoStories) {
    Logger.log();
    Logger.log(`Looks like this is the first time anyone has written stories for ${packageName}`);
    Logger.log(`Configuring package with default template files`);

    // add expo stories field w/ packages
    pkg.expoStories = {};
    pkg.expoStories.packages = {
      [pkg.name]: `~${pkg.version}`,
    };
  }

  // add et start script
  if (!pkg.scripts['start:examples']) {
    pkg.scripts['start:examples'] = 'et run-stories';
  }

  fs.writeFileSync(path.resolve(packageRoot, 'package.json'), JSON.stringify(pkg, null, '\t'), {
    encoding: 'utf-8',
  });

  const tsconfigFile = fs.readFileSync(path.resolve(packageRoot, 'tsconfig.json'), {
    encoding: 'utf-8',
  });

  try {
    const lines = tsconfigFile.split(/\r?\n/);
    const [generatedComment, ...json] = lines;

    const tsconfig = JSON.parse(json.join('\n'));

    let needsWrite = false;

    if (!tsconfig.exclude.includes(['"**/__stories__/*"'])) {
      needsWrite = true;
      tsconfig.exclude.push('**/__stories__/*');
    }

    if (needsWrite) {
      const tsconfigAsString = JSON.stringify(tsconfig, null, '\t');
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
