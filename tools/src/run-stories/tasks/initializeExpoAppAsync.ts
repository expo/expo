import fs from 'fs';
import path from 'path';

import { runExpoCliAsync } from '../../ExpoCLI';
import { getExamplesRoot, getProjectRoot } from '../helpers';

export async function initializeExpoAppAsync(packageName: string) {
  const projectRoot = getProjectRoot(packageName);
  const examplesRoot = getExamplesRoot();
  const projectName = getProjectRoot(packageName);

  if (fs.existsSync(projectRoot)) {
    // @ts-ignore
    fs.rmdirSync(projectRoot, { recursive: true, force: true });
  }

  // 1. initialize expo project w/ name
  await runExpoCliAsync('init', [projectName, '-t', 'bare-minimum', '--no-install'], {
    cwd: examplesRoot,
    stdio: 'ignore',
  });

  // remove .git repo for newly built project
  // @ts-ignore
  fs.rmdirSync(path.resolve(projectRoot, '.git'), { force: true, recursive: true });
}
