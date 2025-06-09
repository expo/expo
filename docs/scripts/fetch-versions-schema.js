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
    `http://exp.host/--/api/v2/sdks/${sdkVersion.replace('v', '')}/native-modules`
  );
  const responseJson = await response.json();
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

VERSIONS.filter(version => version.includes('.')).forEach(async version => {
  await getSchemaAsync(version);
});

const nextVersion = inc(BETA_VERSION ?? LATEST_VERSION, 'major');

await getSchemaAsync(nextVersion, true);

console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully fetched versions schemas`);
