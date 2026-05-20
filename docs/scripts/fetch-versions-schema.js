import fs from 'node:fs';
import path from 'node:path';
import { inc } from 'semver';

import { VERSIONS, LATEST_VERSION, BETA_VERSION } from '../constants/versions.js';

const projectRoot = path.resolve(import.meta.dirname, '..');

export async function getSchemaAsync(sdkVersion, isUnversioned = false) {
  if (!sdkVersion) {
    return;
  }

  const response = await fetch(
    `https://exp.host/--/api/v2/sdks/${sdkVersion.replace('v', '')}/native-modules`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch native module schema for ${sdkVersion}: ${response.status}`);
  }
  const responseJson = await response.json();
  if (!Array.isArray(responseJson?.data)) {
    throw new Error(`Unexpected native module schema response for ${sdkVersion}`);
  }
  const versionData = responseJson.data.map(entry => {
    delete entry.id;
    delete entry.sdkVersion;
    delete entry.createdAt;
    delete entry.updatedAt;
    return entry;
  });

  const outputFilePath = path.join(
    projectRoot,
    `public/static/schemas/${isUnversioned ? 'unversioned' : sdkVersion}/native-modules.json`
  );

  if (fs.existsSync(outputFilePath)) {
    fs.rmSync(outputFilePath);
  }

  fs.writeFileSync(outputFilePath, JSON.stringify({ versions: versionData }), 'utf8', error => {
    if (error) {
      console.error('Error writing file:', error);
      process.exit(1);
    }
  });
}

const versionedVersions = VERSIONS.filter(version => version.includes('.'));
const nextVersion = inc(BETA_VERSION ?? LATEST_VERSION, 'major');

await Promise.all([
  ...versionedVersions.map(version => getSchemaAsync(version)),
  getSchemaAsync(nextVersion, true),
]);

console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully fetched versions schemas`);
