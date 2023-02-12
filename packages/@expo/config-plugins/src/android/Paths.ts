import assert from 'assert';
import fs from 'fs';
import { sync as globSync } from 'glob';
import * as path from 'path';

import { UnexpectedError } from '../utils/errors';
import { directoryExistsAsync } from '../utils/modules';
import { ResourceKind } from './Resources';

export interface ProjectFile<L extends string = string> {
  path: string;
  language: L;
  contents: string;
}

export type ApplicationProjectFile = ProjectFile<'java' | 'kt'>;
export type GradleProjectFile = ProjectFile<'groovy' | 'kt'>;

export function getProjectFilePath(projectRoot: string, name: string): string {
  const filePath = globSync(
    path.join(projectRoot, `android/app/src/main/java/**/${name}.@(java|kt)`)
  )[0];
  assert(
    filePath,
    `Project file "${name}" does not exist in android project for root "${projectRoot}"`
  );

  return filePath;
}

function getLanguage(filePath: string): 'java' | 'groovy' | 'kt' {
  const extension = path.extname(filePath);
  switch (extension) {
    case '.java':
      return 'java';
    case '.kts':
    case '.kt':
      return 'kt';
    case '.groovy':
    case '.gradle':
      return 'groovy';
    default:
      throw new UnexpectedError(`Unexpected Android file extension: ${extension}`);
  }
}

export function getFileInfo(filePath: string) {
  return {
    path: path.normalize(filePath),
    contents: fs.readFileSync(filePath, 'utf8'),
    language: getLanguage(filePath) as any,
  };
}

export async function getMainApplicationAsync(
  projectRoot: string
): Promise<ApplicationProjectFile> {
  const filePath = getProjectFilePath(projectRoot, 'MainApplication');
  return getFileInfo(filePath);
}

export async function getMainActivityAsync(projectRoot: string): Promise<ApplicationProjectFile> {
  const filePath = getProjectFilePath(projectRoot, 'MainActivity');
  return getFileInfo(filePath);
}

export function getGradleFilePath(projectRoot: string, gradleName: string): string {
  const groovyPath = path.resolve(projectRoot, `${gradleName}.gradle`);
  const ktPath = path.resolve(projectRoot, `${gradleName}.gradle.kts`);

  const isGroovy = fs.existsSync(groovyPath);
  const isKotlin = !isGroovy && fs.existsSync(ktPath);

  if (!isGroovy && !isKotlin) {
    throw new Error(`Failed to find '${gradleName}.gradle' file for project: ${projectRoot}.`);
  }
  const filePath = isGroovy ? groovyPath : ktPath;
  return filePath;
}

export function getProjectBuildGradleFilePath(projectRoot: string): string {
  return getGradleFilePath(path.join(projectRoot, 'android'), 'build');
}

export async function getProjectBuildGradleAsync(projectRoot: string): Promise<GradleProjectFile> {
  return getFileInfo(getProjectBuildGradleFilePath(projectRoot));
}

export function getSettingsGradleFilePath(projectRoot: string): string {
  return getGradleFilePath(path.join(projectRoot, 'android'), 'settings');
}

export async function getSettingsGradleAsync(projectRoot: string): Promise<GradleProjectFile> {
  return getFileInfo(getSettingsGradleFilePath(projectRoot));
}

export function getAppBuildGradleFilePath(projectRoot: string): string {
  return getGradleFilePath(path.join(projectRoot, 'android', 'app'), 'build');
}

export async function getAppBuildGradleAsync(projectRoot: string): Promise<GradleProjectFile> {
  return getFileInfo(getAppBuildGradleFilePath(projectRoot));
}

export async function getProjectPathOrThrowAsync(projectRoot: string): Promise<string> {
  const projectPath = path.join(projectRoot, 'android');
  if (await directoryExistsAsync(projectPath)) {
    return projectPath;
  }
  throw new Error(`Android project folder is missing in project: ${projectRoot}`);
}

export async function getAndroidManifestAsync(projectRoot: string): Promise<string> {
  const projectPath = await getProjectPathOrThrowAsync(projectRoot);
  const filePath = path.join(projectPath, 'app/src/main/AndroidManifest.xml');
  return filePath;
}

export async function getResourceFolderAsync(projectRoot: string): Promise<string> {
  const projectPath = await getProjectPathOrThrowAsync(projectRoot);
  return path.join(projectPath, `app/src/main/res`);
}

export async function getResourceXMLPathAsync(
  projectRoot: string,
  { kind = 'values', name }: { kind?: ResourceKind; name: 'colors' | 'strings' | 'styles' | string }
): Promise<string> {
  const resourcePath = await getResourceFolderAsync(projectRoot);

  const filePath = path.join(resourcePath, `${kind}/${name}.xml`);
  return filePath;
}
