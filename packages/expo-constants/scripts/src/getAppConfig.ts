import { getConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';

const possibleProjectRoot = process.argv[2];
const destinationDir = process.argv[3];

// TODO: Verify we can remove projectRoot validation, now that we no longer
// support React Native <= 62
let projectRoot;
if (fs.existsSync(path.join(possibleProjectRoot, 'package.json'))) {
  projectRoot = possibleProjectRoot;
} else if (fs.existsSync(path.join(possibleProjectRoot, '..', 'package.json'))) {
  projectRoot = path.resolve(possibleProjectRoot, '..');
} else {
  throw new Error(
    `Unable to locate project (no package.json found) at path: ${possibleProjectRoot}`
  );
}

require('@expo/env').load(projectRoot);
process.chdir(projectRoot);

const { exp } = getConfig(projectRoot, {
  isPublicConfig: true,
  skipSDKVersionRequirement: true,
});
fs.writeFileSync(path.join(destinationDir, 'app.config'), JSON.stringify(exp));
