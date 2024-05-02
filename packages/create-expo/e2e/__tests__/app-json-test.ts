import fs from 'fs';
import path from 'path';

import {
  createFixtureTarball,
  createTestPath,
  ensureFolderExists,
  executePassing,
  expectFileExists,
  projectRoot,
} from './utils';

beforeAll(async () => {
  ensureFolderExists(projectRoot);
});

it('creates project with app.json without root `expo` object', async () => {
  const projectName = 'flat-app-json';

  // Create test path and tarball
  createTestPath(projectName);
  const tarballPath = await createFixtureTarball('flat-app-json');

  // Create the project from tarball
  await executePassing([projectName, '--no-install', '--template', tarballPath]);

  // Ensure the app.json is written properly
  expectFileExists(projectName, 'app.json');

  const appJsonPath = path.join(projectRoot, projectName, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, { encoding: 'utf8' }));

  expect(appJson).toMatchObject({
    name: projectName,
    slug: projectName,
  });
});
