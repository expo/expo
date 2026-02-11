import fs from 'fs';
import * as path from 'path';

import { getSharedFilesPath, getTemplateFilesPath } from '../utils';
import { createEntitlementsFile } from './createEntitlements';
import createInfoPlistFile from './createInfoPlistFile';
import { ActivationRule } from '../sharingPlugin.types';

export type ProjectFiles = {
  swiftFiles: string[];
  entitlementFiles: string[];
  plistFiles: string[];
  assetDirectories: string[];
  intentFiles: string[];
  otherFiles: string[];
};

export type ShareExtensionFiles = ProjectFiles & {
  sharedFiles: ProjectFiles | null;
};

/**
 * Copies the template files into the native project directory and prepares the extension entitlements file.
 * @returns Object storing categorized copied files.
 * Note @behenate: This doesn't support nested folders as of now, we don't need this, so I didn't bother adding it.
 */
export function setupShareExtensionFiles(
  targetPath: string,
  extensionTargetName: string,
  appGroupId: string,
  urlScheme: string,
  activationRule: ActivationRule
): ShareExtensionFiles {
  const templateFilesPath = getTemplateFilesPath('ios');
  const sharedDirectoryPath = getSharedFilesPath();

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  const targetSharedPath = path.join(targetPath, 'shared');
  if (!fs.existsSync(targetSharedPath)) {
    fs.mkdirSync(targetSharedPath, { recursive: true });
  }

  createEntitlementsFile(targetPath, extensionTargetName, appGroupId);
  createInfoPlistFile(targetPath, appGroupId, urlScheme, activationRule);

  const extensionTargetFiles = parseDirectoryFiles(templateFilesPath);
  const sharedFiles = parseDirectoryFiles(sharedDirectoryPath);

  const shareExtensionFiles: ShareExtensionFiles = {
    ...extensionTargetFiles,
    sharedFiles,
  };

  Object.values(extensionTargetFiles)
    .flat()
    .forEach((file) => {
      const source = path.join(templateFilesPath, file);
      copyFileSync(source, targetPath);
    });

  return shareExtensionFiles;
}

export function parseDirectoryFiles(directoryPath: string): ProjectFiles {
  const projectFiles: ProjectFiles = {
    swiftFiles: [],
    entitlementFiles: [],
    plistFiles: [],
    assetDirectories: [],
    intentFiles: [],
    otherFiles: [],
  };

  if (fs.lstatSync(directoryPath).isDirectory()) {
    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
      // Skip directories
      if (fs.lstatSync(path.join(directoryPath, file)).isDirectory()) {
        return;
      }

      const fileExtension = file.split('.').pop();
      switch (fileExtension) {
        case 'swift':
          projectFiles.swiftFiles.push(file);
          break;
        case 'entitlements':
          projectFiles.entitlementFiles.push(file);
          break;
        case 'plist':
          projectFiles.plistFiles.push(file);
          break;
        case 'xcassets':
          projectFiles.assetDirectories.push(file);
          break;
        case 'intentdefinition':
          projectFiles.intentFiles.push(file);
          break;
        default:
          projectFiles.otherFiles.push(file);
          break;
      }
    });
  }

  return projectFiles;
}

export function copyFileSync(source: string, target: string) {
  let targetFile = target;

  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    targetFile = path.join(target, path.basename(source));
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}
