import {
  AndroidManifest,
  readAndroidManifestAsync,
  writeAndroidManifestAsync,
} from '@expo/config-plugins/build/android/Manifest';
import * as Scheme from '@expo/config-plugins/build/android/Scheme';
import { format } from '@expo/config-plugins/build/utils/XML';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { existsSync } from 'fs';
import path from 'path';

import { CommandError, Options } from './Options';

const CANT_START_ACTIVITY_ERROR = 'Activity not started, unable to resolve Intent';
const BEGINNING_OF_ADB_ERROR_MESSAGE = 'error: ';

export function isAvailable(projectRoot: string): boolean {
  return (
    existsSync(path.join(projectRoot, 'android/app/src/main/AndroidManifest.xml')) ||
    existsSync(path.join(projectRoot, 'app/src/main/AndroidManifest.xml'))
  );
}

export async function addAsync({
  dryRun,
  uri,
  manifestPath,
  projectRoot,
}: Pick<Options, 'dryRun' | 'uri' | 'manifestPath' | 'projectRoot'>): Promise<boolean> {
  const resolvedManifestPath = manifestPath ?? getConfigPath(projectRoot);
  let manifest = await readConfigAsync(resolvedManifestPath);

  if (!Scheme.ensureManifestHasValidIntentFilter(manifest)) {
    throw new CommandError(
      `Cannot add scheme "${uri}" because the provided manifest does not have a valid Activity with \`android:launchMode="singleTask"\`.\nThis guide can help you get setup properly https://expo.fyi/setup-android-uri-scheme`,
      'add'
    );
  }
  if (Scheme.hasScheme(uri, manifest)) {
    console.log(
      chalk.yellow(
        `\u203A Android: URI scheme "${uri}" already exists in AndroidManifest.xml at: ${resolvedManifestPath}`
      )
    );
    return false;
  }

  manifest = Scheme.appendScheme(uri, manifest);

  if (dryRun) {
    console.log(chalk.magenta('Write manifest to: ', resolvedManifestPath));
    console.log(format(manifest));
    return false;
  }
  await writeConfigAsync(resolvedManifestPath, manifest);
  return true;
}

export async function removeAsync({
  dryRun,
  uri,
  manifestPath,
  projectRoot,
}: Pick<Options, 'dryRun' | 'uri' | 'manifestPath' | 'projectRoot'>): Promise<boolean> {
  const resolvedManifestPath = manifestPath ?? getConfigPath(projectRoot);
  let manifest = await readConfigAsync(resolvedManifestPath);

  if (!Scheme.ensureManifestHasValidIntentFilter(manifest)) {
    throw new CommandError(
      `Cannot remove scheme "${uri}" because the provided manifest does not have a valid Activity with \`android:launchMode="singleTask"\`.\nThis guide can help you get setup properly https://expo.fyi/setup-android-uri-scheme`,
      'remove'
    );
  }

  if (!Scheme.hasScheme(uri, manifest)) {
    console.log(
      chalk.yellow(
        `\u203A Android: URI scheme "${uri}" does not exist in AndroidManifest.xml at: ${resolvedManifestPath}`
      )
    );
    return false;
  }

  manifest = Scheme.removeScheme(uri, manifest);

  if (dryRun) {
    console.log(chalk.magenta('Write manifest to: ', resolvedManifestPath));
    console.log(format(manifest));
    return false;
  }
  await writeConfigAsync(resolvedManifestPath, manifest);
  return true;
}

function whichADB(): string {
  if (process.env.ANDROID_HOME) {
    return `${process.env.ANDROID_HOME}/platform-tools/adb`;
  }
  return 'adb';
}

export async function getAdbOutputAsync(args: string[]): Promise<string> {
  const adb = whichADB();

  try {
    const result = await spawnAsync(adb, args);
    return result.stdout;
  } catch (e: any) {
    const err: string = e.stderr || e.stdout || '';
    let errorMessage = err.trim();
    if (errorMessage.startsWith(BEGINNING_OF_ADB_ERROR_MESSAGE)) {
      errorMessage = errorMessage.substring(BEGINNING_OF_ADB_ERROR_MESSAGE.length);
    }
    throw new CommandError(errorMessage);
  }
}

async function openUrlAsync(...props: (string | null)[]): Promise<string> {
  const output = await getAdbOutputAsync([
    'shell',
    'am',
    'start',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    ...(props.filter(Boolean) as string[]),
  ]);
  if (output.includes(CANT_START_ACTIVITY_ERROR)) {
    throw new CommandError(output.substring(output.indexOf('Error: ')));
  }

  return output;
}

export async function openAsync({
  uri,
  androidPackage,
}: Pick<Options, 'uri'> & { androidPackage?: string }): Promise<string> {
  return await openUrlAsync(uri.replace(/&/g, String.raw`\&`), androidPackage ?? null);
}

export async function getAsync({
  projectRoot,
  manifestPath,
}: Pick<Options, 'projectRoot' | 'manifestPath'>): Promise<string[]> {
  const manifest = await readConfigAsync(manifestPath ?? getConfigPath(projectRoot));
  return await Scheme.getSchemesFromManifest(manifest);
}

function getPackage(androidManifest: AndroidManifest): string | null {
  return androidManifest.manifest?.$?.package ?? null;
}

export async function getProjectIdAsync({
  projectRoot,
  manifestPath,
}: Pick<Options, 'projectRoot' | 'manifestPath'>): Promise<string> {
  const resolvedManifestPath = manifestPath ?? getConfigPath(projectRoot);
  const manifest = await readConfigAsync(resolvedManifestPath);
  const androidPackage = getPackage(manifest);
  if (!androidPackage)
    throw new CommandError(
      `Android: Failed to resolve android package for Manifest at path: ${resolvedManifestPath}`
    );
  return androidPackage;
}

export function getConfigPath(projectRoot: string): string {
  const paths = [
    'android/app/src/main/AndroidManifest.xml',
    'app/src/main/AndroidManifest.xml',
  ].map(relative => path.join(projectRoot, relative));
  for (const manifestPath of paths) {
    if (existsSync(manifestPath)) {
      return manifestPath;
    }
  }
  throw new Error(`Could not find AndroidManifest.xml, looked in: ${paths.join(', ')}`);
}

async function readConfigAsync(path: string): Promise<any> {
  return await readAndroidManifestAsync(path);
}

async function writeConfigAsync(path: string, result: any) {
  await writeAndroidManifestAsync(path, result);
}
