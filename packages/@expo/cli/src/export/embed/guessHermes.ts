import fs from 'fs';
import path from 'path';

const ASSUME_HERMES_IS_USED_BY_DEFAULT = true;

function parseGradleProperties(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let line of content.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const sepIndex = line.indexOf('=');
    const key = line.substr(0, sepIndex);
    const value = line.substr(sepIndex + 1);
    result[key] = value;
  }
  return result;
}

export function isAndroidUsingHermes(projectRoot: string) {
  // Check gradle.properties from prebuild template
  const gradlePropertiesPath = path.join(projectRoot, 'android', 'gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    const props = parseGradleProperties(fs.readFileSync(gradlePropertiesPath, 'utf8'));
    return props['hermesEnabled'] === 'true';
  }

  return ASSUME_HERMES_IS_USED_BY_DEFAULT;
}

export function isIosUsingHermes(projectRoot: string) {
  // Trying best to check ios native project if by chance to be consistent between app config

  // Check ios/Podfile for ":hermes_enabled => true"
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  if (fs.existsSync(podfilePath)) {
    const content = fs.readFileSync(podfilePath, 'utf8');
    return content.search(/^\s*:hermes_enabled\s*=>\s*true,?\s+/m) >= 0;
  }

  return ASSUME_HERMES_IS_USED_BY_DEFAULT;
}
