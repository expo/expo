const { getConfig } = require('@expo/config');
const fs = require('fs');
const path = require('path');

const possibleProjectRoot = process.argv[2];
const destinationDir = process.argv[3];

// Remove projectRoot validation when we no longer support React Native <= 62
let projectRoot;
if (fs.existsSync(path.join(possibleProjectRoot, 'package.json'))) {
  projectRoot = possibleProjectRoot;
} else if (fs.existsSync(path.join(possibleProjectRoot, '..', 'package.json'))) {
  projectRoot = path.resolve(possibleProjectRoot, '..');
}

process.chdir(projectRoot);

const { exp } = getConfig(projectRoot, {
  isPublicConfig: true,
  skipSDKVersionRequirement: true,
});
fs.writeFileSync(path.join(destinationDir, 'app.config'), JSON.stringify(exp));
