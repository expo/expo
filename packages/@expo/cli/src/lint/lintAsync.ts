import fs from 'fs/promises';
import path from 'path';

export const lintAsync = async (projectRoot: string) => {
  console.log('projectRoot, ', projectRoot);
  try {
    await fs.readFile(path.join(projectRoot, '.eslintrc.js'), 'utf8');
  } catch {
    console.log('No eslint file found');
  }

  console.log('Hello again');

  return Promise.resolve('Done');
};
