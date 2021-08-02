import fs from 'fs';
import path from 'path';

export function getPackageRoot(packageName: string) {
  // eslint-disable-next-line
  const packageRoot = path.resolve(__dirname, '../../../packages', packageName);

  if (!fs.existsSync(packageRoot)) {
    throw new Error(
      `${packageName} does not exist - are you sure you selected the correct package?`
    );
  }

  return packageRoot;
}

export function getExamplesRoot() {
  // eslint-disable-next-line
  const examplesRoot = path.resolve(__dirname, '../../../story-loaders');

  if (!fs.existsSync(examplesRoot)) {
    fs.mkdirSync(examplesRoot);
  }

  return examplesRoot;
}

export function getProjectRoot(packageName: string) {
  const examplesRoot = getExamplesRoot();
  const projectName = `${packageName}-stories`;
  const projectRoot = path.resolve(examplesRoot, projectName);
  return projectRoot;
}

export function getTargetName(packageName: string) {
  const projectName = `${packageName}-stories`;
  const targetName = projectName.split('-').join('');
  return targetName;
}

export function getProjectName(packageName: string) {
  return `${packageName}-stories`;
}
