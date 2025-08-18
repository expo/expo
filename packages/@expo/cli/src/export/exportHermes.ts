import { ExpoConfig, getConfigFilePaths, Platform } from '@expo/config';
import JsonFile from '@expo/json-file';
import fs from 'fs';
import path from 'path';

const PODFILE_HERMES_LHS = /(?::hermes_enabled\s*=>|hermes_enabled\s*:)/;
const PODFILE_HERMES_PROPS_REFERENCE_RE = new RegExp(
  String.raw`^\s*${PODFILE_HERMES_LHS.source}\s*podfile_properties\['expo\.jsEngine'\]\s*==\s*nil\s*\|\|\s*podfile_properties\['expo\.jsEngine'\]\s*==\s*'hermes'\s*,?\s*(?:#.*)?$`,
  'm'
);
const PODFILE_HERMES_TRUE_RE = new RegExp(
  String.raw`^\s*${PODFILE_HERMES_LHS.source}\s*true\s*(?:,\s*)?(?:[^\n]*)?$`,
  'm'
);
const PODFILE_HERMES_FALSE_RE = new RegExp(
  String.raw`^\s*${PODFILE_HERMES_LHS.source}\s*false\s*(?:,\s*)?(?:[^\n]*)?$`,
  'm'
);

function getLiteralHermesSettingFromPodfile(content: string): boolean | null {
  const isPropsReference = content.search(PODFILE_HERMES_PROPS_REFERENCE_RE) >= 0;
  if (isPropsReference) {
    return null;
  }
  if (PODFILE_HERMES_TRUE_RE.test(content)) {
    return true;
  }
  if (PODFILE_HERMES_FALSE_RE.test(content)) {
    return false;
  }
  return null;
}

export async function assertEngineMismatchAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'ios' | 'android' | 'jsEngine'>,
  platform: Platform
) {
  const isHermesManaged = isEnableHermesManaged(exp, platform);
  const paths = getConfigFilePaths(projectRoot);
  const configFilePath = paths.dynamicConfigPath ?? paths.staticConfigPath ?? 'app.json';
  await maybeThrowFromInconsistentEngineAsync(
    projectRoot,
    configFilePath,
    platform,
    isHermesManaged
  );
}

export function isEnableHermesManaged(
  expoConfig: Partial<Pick<ExpoConfig, 'ios' | 'android' | 'jsEngine'>>,
  platform: string
): boolean {
  switch (platform) {
    case 'android': {
      return (expoConfig.android?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
    }
    case 'ios': {
      return (expoConfig.ios?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
    }
    default:
      return false;
  }
}

export function parseGradleProperties(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let line of content.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const sepIndex = line.indexOf('=');
    const key = line.slice(0, sepIndex);
    const value = line.slice(sepIndex + 1);
    result[key] = value;
  }
  return result;
}

export async function maybeThrowFromInconsistentEngineAsync(
  projectRoot: string,
  configFilePath: string,
  platform: string,
  isHermesManaged: boolean
): Promise<void> {
  const configFileName = path.basename(configFilePath);
  if (
    platform === 'android' &&
    (await maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged))
  ) {
    throw new Error(
      `JavaScript engine configuration is inconsistent between ${configFileName} and Android native project.\n` +
        `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` +
        `In Android native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` +
        `Check the following files for inconsistencies:\n` +
        `  - ${configFilePath}\n` +
        `  - ${path.join(projectRoot, 'android', 'gradle.properties')}\n` +
        `  - ${path.join(projectRoot, 'android', 'app', 'build.gradle')}\n` +
        'Learn more: https://expo.fyi/hermes-android-config'
    );
  }

  if (platform === 'ios' && (await maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged))) {
    throw new Error(
      `JavaScript engine configuration is inconsistent between ${configFileName} and iOS native project.\n` +
        `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` +
        `In iOS native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` +
        `Check the following files for inconsistencies:\n` +
        `  - ${configFilePath}\n` +
        `  - ${path.join(projectRoot, 'ios', 'Podfile')}\n` +
        `  - ${path.join(projectRoot, 'ios', 'Podfile.properties.json')}\n` +
        'Learn more: https://expo.fyi/hermes-ios-config'
    );
  }
}

export async function maybeInconsistentEngineAndroidAsync(
  projectRoot: string,
  isHermesManaged: boolean
): Promise<boolean> {
  // Trying best to check android native project if by chance to be consistent between app config

  // Check gradle.properties from prebuild template
  const gradlePropertiesPath = path.join(projectRoot, 'android', 'gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    const props = parseGradleProperties(await fs.promises.readFile(gradlePropertiesPath, 'utf8'));
    const isHermesBare = props['hermesEnabled'] === 'true';
    if (isHermesManaged !== isHermesBare) {
      return true;
    }
  }

  return false;
}

export function isHermesPossiblyEnabled(projectRoot: string): boolean | null {
  // Trying best to check ios native project if by chance to be consistent between app config

  // Check ios/Podfile for a literal :hermes_enabled => (true|false) or hermes_enabled: (true|false)
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  if (fs.existsSync(podfilePath)) {
    const content = fs.readFileSync(podfilePath, 'utf8');
    const literal = getLiteralHermesSettingFromPodfile(content);
    if (literal != null) return literal;

    // If there is no props reference and no literal, assume Hermes is enabled by default
    const hasPropsReference = PODFILE_HERMES_PROPS_REFERENCE_RE.test(content);
    if (!hasPropsReference) {
      return true;
    }
  }

  // Check Podfile.properties.json from prebuild template
  const podfilePropertiesPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');
  if (fs.existsSync(podfilePropertiesPath)) {
    try {
      const props = JsonFile.read(podfilePropertiesPath);
      return props['expo.jsEngine'] === 'hermes';
    } catch {
      // ignore
    }
  }

  return null;
}

export async function maybeInconsistentEngineIosAsync(
  projectRoot: string,
  isHermesManaged: boolean
): Promise<boolean> {
  // Trying best to check ios native project if by chance to be consistent between app config

  // Check ios/Podfile for a literal :hermes_enabled => (true|false)
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  if (fs.existsSync(podfilePath)) {
    const content = await fs.promises.readFile(podfilePath, 'utf8');
    const literal = getLiteralHermesSettingFromPodfile(content);
    if (literal != null) {
      if (isHermesManaged !== literal) return true;
    } else {
      // If there is no props reference and no literal, assume Hermes is enabled by default
      const hasPropsReference = PODFILE_HERMES_PROPS_REFERENCE_RE.test(content);
      if (!hasPropsReference) {
        const assumedEnabled = true;
        if (isHermesManaged !== assumedEnabled) return true;
      }
    }
  }

  // Check Podfile.properties.json from prebuild template
  const podfilePropertiesPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');
  if (fs.existsSync(podfilePropertiesPath)) {
    const props = await parsePodfilePropertiesAsync(podfilePropertiesPath);
    const isHermesBare = props['expo.jsEngine'] === 'hermes';
    if (isHermesManaged !== isHermesBare) {
      return true;
    }
  }

  return false;
}

// https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25
const HERMES_MAGIC_HEADER = 'c61fbc03c103191f';

export async function isHermesBytecodeBundleAsync(file: string): Promise<boolean> {
  const header = await readHermesHeaderAsync(file);
  return header.subarray(0, 8).toString('hex') === HERMES_MAGIC_HEADER;
}

export async function getHermesBytecodeBundleVersionAsync(file: string): Promise<number> {
  const header = await readHermesHeaderAsync(file);
  if (header.subarray(0, 8).toString('hex') !== HERMES_MAGIC_HEADER) {
    throw new Error('Invalid hermes bundle file');
  }
  return header.readUInt32LE(8);
}

async function readHermesHeaderAsync(file: string): Promise<Buffer> {
  const fd = await fs.promises.open(file, 'r');
  const buffer = Buffer.alloc(12);
  await fd.read(buffer, 0, 12, null);
  await fd.close();
  return buffer;
}

async function parsePodfilePropertiesAsync(
  podfilePropertiesPath: string
): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.promises.readFile(podfilePropertiesPath, 'utf8'));
  } catch {
    return {};
  }
}

export function isAndroidUsingHermes(projectRoot: string) {
  // Check gradle.properties from prebuild template
  const gradlePropertiesPath = path.join(projectRoot, 'android', 'gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    const props = parseGradleProperties(fs.readFileSync(gradlePropertiesPath, 'utf8'));
    return props['hermesEnabled'] === 'true';
  }

  // Assume Hermes is used by default.
  return true;
}

export function isIosUsingHermes(projectRoot: string) {
  // If nullish, then assume Hermes is used.
  return isHermesPossiblyEnabled(projectRoot) !== false;
}
