import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import { glob as globAsync } from 'glob';
import path from 'path';

import { createTempDirectoryPath } from '../../utils/createTempPath';
import { CommandError } from '../../utils/errors';
import { parsePlistAsync } from '../../utils/plist';

const debug = require('debug')('expo:run:ios:binary');

export async function getValidBinaryPathAsync(input: string, props: { isSimulator: boolean }) {
  const resolved = path.resolve(input);

  if (!fs.existsSync(resolved)) {
    throw new CommandError(`The path to the iOS binary does not exist: ${resolved}`);
  }

  // If the file is an ipa then move it to a temp directory and extract the app binary.
  if (resolved.endsWith('.ipa')) {
    const outputPath = createTempDirectoryPath();
    debug('Extracting IPA:', resolved, outputPath);
    const appDir = await extractIpaAsync(resolved, outputPath);

    if (props.isSimulator) {
      assertProvisionedForSimulator(appDir);
    } else {
      // TODO: Assert provisioned for devices in the future (this is difficult).
    }
    return appDir;
  }
  return resolved;
}

async function extractIpaAsync(ipaPath: string, outputPath: string): Promise<string> {
  // Create the output directory if it does not exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Use the unzip command to extract the IPA file
  try {
    await spawnAsync('unzip', ['-o', ipaPath, '-d', outputPath]);
  } catch (error: any) {
    throw new Error(`Error extracting IPA: ${error.message}`);
  }

  const appBinPaths = await globAsync('Payload/*.app', {
    cwd: outputPath,
    absolute: true,
    maxDepth: 2,
  });

  if (appBinPaths.length === 0) {
    throw new Error('No .app directory found in the IPA');
  }

  return appBinPaths[0];
}

async function assertProvisionedForSimulator(appPath: string) {
  const provisionPath = path.join(appPath, 'embedded.mobileprovision');

  if (!fs.existsSync(provisionPath)) {
    // This can often result in false positives.
    debug('No embedded.mobileprovision file found. Likely provisioned for simulator.');
    return;
  }

  const provisionData = fs.readFileSync(provisionPath, 'utf8');
  const start = provisionData.indexOf('<?xml');
  const end = provisionData.indexOf('</plist>') + 8;
  const plistData = provisionData.substring(start, end);
  const parsedData = await parsePlistAsync(plistData);

  const platforms = parsedData['ProvisionsAllDevices'];
  if (platforms) {
    throw new CommandError(
      'The app binary is provisioned for devices, and cannot be run on simulators.'
    );
  }
}
