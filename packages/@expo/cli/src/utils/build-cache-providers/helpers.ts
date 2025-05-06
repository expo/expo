import fs from 'fs';

export function moduleNameIsDirectFileReference(name: string): boolean {
  // Check if path is a file. Matches lines starting with: . / ~/
  if (name.match(/^(\.|~\/|\/)/g)) {
    return true;
  }

  const slashCount = name.split('/')?.length;
  // Orgs (like @expo/config ) should have more than one slash to be a direct file.
  if (name.startsWith('@')) {
    return slashCount > 2;
  }

  // Regular packages should be considered direct reference if they have more than one slash.
  return slashCount > 1;
}

export function moduleNameIsPackageReference(name: string): boolean {
  const slashCount = name.split('/')?.length;
  return name.startsWith('@') ? slashCount === 2 : slashCount === 1;
}

export function fileExists(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}
