/**
 * This script removes given SDK version from docs website.
 * - yarn run remove-version 38 -> removes all the pages and files related to the SDK 38
 */

import fs from 'fs-extra';

const version = process.argv[2];

const run = () => {
  if (!version) {
    console.log('Please enter a version number!\n');
    console.log('E.g., "yarn remove-version 38"');
    return;
  }

  try {
    const apiDataPath = `public/static/data/v${version}.0.0`;
    if (fs.pathExistsSync(apiDataPath)) {
      fs.rmSync(apiDataPath, { recursive: true });
    }

    const examplesPath = `public/static/examples/v${version}.0.0`;
    if (fs.pathExistsSync(examplesPath)) {
      fs.rmSync(examplesPath, { recursive: true });
    }

    const schemaPath = `public/static/schemas/v${version}.0.0`;
    if (fs.pathExistsSync(schemaPath)) {
      fs.rmSync(schemaPath, { recursive: true });
    }

    const pagesPath = `pages/versions/v${version}.0.0`;
    if (fs.pathExistsSync(pagesPath)) {
      fs.rmSync(pagesPath, { recursive: true });
    }
  } catch (e) {
    console.error(e);
  }

  console.log(`🎉 SDK ${version} files have been removed successfully!`);
};

run();
