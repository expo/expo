import { readdirSync } from 'fs';

// Any of these files are allowed to exist in the projectRoot
const tolerableFiles = [
  // System
  '.DS_Store',
  'Thumbs.db',
  // Git
  '.git',
  '.gitattributes',
  '.gitignore',
  // Project
  '.npmignore',
  'LICENSE',
  'docs',
  '.idea',
  // Package manager
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log',
];

export function getConflictsForDirectory(projectRoot: string): string[] {
  return readdirSync(projectRoot).filter(
    (file: string) => !(/\.iml$/.test(file) || tolerableFiles.includes(file))
  );
}
