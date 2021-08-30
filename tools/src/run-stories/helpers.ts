import fs from 'fs';
import path from 'path';

// eslint-disable-next-line
const expoRepoRoot = path.resolve(__dirname, '../../../');

export function getPackageRoot(packageName: string) {
  const packageRoot = path.resolve(expoRepoRoot, 'packages', packageName);

  if (!fs.existsSync(packageRoot)) {
    throw new Error(`${packageName} does not exist - are you sure you have the correct package?`);
  }

  return packageRoot;
}

export function getExamplesRoot() {
  const examplesRoot = path.resolve(expoRepoRoot, 'stories');

  if (!fs.existsSync(examplesRoot)) {
    fs.mkdirSync(examplesRoot);
  }

  return examplesRoot;
}

export function getProjectRoot(packageName: string) {
  const examplesRoot = getExamplesRoot();
  const projectName = getProjectName(packageName);
  const projectRoot = path.resolve(examplesRoot, projectName);
  return projectRoot;
}

export function getTargetName(packageName: string) {
  const projectName = getProjectName(packageName);
  const targetName = projectName.split('-').join('');
  return targetName;
}

export function getProjectName(packageName: string) {
  return `${packageName}-stories`;
}

export function getTemplateRoot(packageName: string) {
  const projectRoot = getProjectRoot(packageName);
  const templateRoot = path.resolve(projectRoot, '../../template-files/stories-templates');
  return templateRoot;
}
