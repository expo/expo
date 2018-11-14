const fs = require('fs');
const { Config, Versions } = require('xdl');

const supplyValidate = async () => {
  const buildGradle = fs.readFileSync('../android/app/build.gradle', 'utf8');
  const versionCode = buildGradle.match(/versionCode (\d+)/)[1];
  const versionName = buildGradle.match(/versionName '([\d\.]+)'/)[1];

  if (!fs.existsSync(`../fastlane/android/metadata/en-US/changelogs/${versionCode}.txt`)) {
    throw new Error(`Missing changelog file at fastlane/android/metadata/en-US/changelogs/${versionCode}.txt`);
  }

  Config.api.host = 'staging.exp.host';
  const versionsStaging = await Versions.versionsAsync();
  if (versionsStaging.androidVersion !== versionName) {
    throw new Error(`APK version ${versionName} is not yet uploaded to staging. Please download from the client_android CI job, test and upload manually.`);
  }

  console.log('version and changelog look ok');
};

module.exports = supplyValidate;
