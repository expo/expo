import fs from 'fs';
import path from 'path';

import { getPackageRoot, getProjectRoot, getTemplateRoot } from '../helpers';

// Adds default settings to prepare a package for expo-stories:
// 1. Adds yarn start:examples script in package.json
// 2. Creates default story file in package if there are no other stories
export async function initializeDefaultsAsync(packageName: string) {
  const packageRoot = getPackageRoot(packageName);

  const pkg = require(path.resolve(packageRoot, 'package.json'));

  let shouldWritePkg = false;

  if (!pkg.scripts['start:examples']) {
    shouldWritePkg = true;
    pkg.scripts['start:examples'] = 'et run-stories';
  }

  if (shouldWritePkg) {
    fs.writeFileSync(
      path.resolve(packageRoot, 'package.json'),
      JSON.stringify(pkg, null, 2) + '\n',
      {
        encoding: 'utf-8',
      }
    );
  }

  if (!fs.existsSync(path.resolve(packageRoot, 'src', '__stories__'))) {
    fs.mkdirSync(path.resolve(packageRoot, 'src', '__stories__'));

    const projectRoot = getProjectRoot(packageName);
    const templateRoot = getTemplateRoot(packageName);
    const templateDir = path.resolve(projectRoot, templateRoot, 'defaultStory.js');

    fs.copyFileSync(
      templateDir,
      path.resolve(packageRoot, 'src', '__stories__', 'DefaultStory.stories.tsx')
    );
  }
}
