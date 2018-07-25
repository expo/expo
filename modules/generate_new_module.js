#!/usr/bin/env node

const readline = require('readline');
const proc = require('child_process');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestionAsync = (question, resultMerger) =>
  new Promise((resolve, reject) => {
    rl.question(`${question} `, answer => {
      // rl.close();
      resolve(resultMerger(answer));
    });
  });

let configuration = {
  jsName: null,
  podName: null,
  javaModule: null,
};

// Promise.all([

// ]);

async function main() {
  await askQuestionAsync(
    'How would you like to call your module in JS/NPM? (eg. expo-camera)',
    jsName => {
      configuration.jsName = jsName;
    }
  );
  await askQuestionAsync(
    'How would you like to call your module in Cocoapods? (eg. EXCamera) (leave empty to not include iOS part)',
    podName => {
      configuration.podName = podName;
    }
  );
  await askQuestionAsync(
    'How would you like to call your module in Java? (eg. expo.modules.camera)',
    javaModule => {
      configuration.javaModule = javaModule;
    }
  );
  proc.execSync(`cp -R expo-module-template ${configuration.jsName}`);
  proc.execSync(`find ./${configuration.jsName} -name '.DS_Store' -type f -delete`);
  if (configuration.podName) {
    proc.execSync(
      `mv ${configuration.jsName}/ios/EXModuleTemplate.podspec ${configuration.jsName}/ios/${configuration.podName}.podspec`
    );
    proc.execSync(
      `mv ${configuration.jsName}/ios/EXModuleTemplate/EXModuleTemplate.h ${configuration.jsName}/ios/EXModuleTemplate/${configuration.podName}.h`
    );
    proc.execSync(
      `mv ${configuration.jsName}/ios/EXModuleTemplate/EXModuleTemplate.m ${configuration.jsName}/ios/EXModuleTemplate/${configuration.podName}.m`
    );
    proc.execSync(
      `mv ${configuration.jsName}/ios/EXModuleTemplate ${configuration.jsName}/ios/${configuration.podName}`
    );
    proc.execSync(
      `mv ${configuration.jsName}/ios/EXModuleTemplate.xcodeproj ${configuration.jsName}/ios/${configuration.podName}.xcodeproj`
    );
  } else {
    proc.execSync(`rm -r ${configuration.jsName}/ios`);
    proc.execSync(`rm ${configuration.jsName}/ios/EXModuleTemplate.podspec`);
  }

  proc.execSync(
    `find ./${configuration.jsName} -type f -exec sed -i '' -e 's/expo-module-template/${configuration.jsName}/g' {} \\;`
  );
  proc.execSync(
    `find ./${configuration.jsName} -type f -exec sed -i '' -e 's/expo.modules.template/${configuration.javaModule}/g' {} \\;`
  );
  proc.execSync(
    `find ./${configuration.jsName} -type f -exec sed -i '' -e 's/EXModuleTemplate/${configuration.podName}/g' {} \\;`
  );

  const javaDir = path.join(
    configuration.jsName,
    'android',
    'src',
    'main',
    'java',
    ...configuration.javaModule.split('.')
  );

  proc.execSync(`mkdir -p ${javaDir}`);

  proc.execSync(`echo "package ${configuration.javaModule};" > ${javaDir}/Placeholder.java`);
  proc.execSync(`echo "class Placeholder {}" >> ${javaDir}/Placeholder.java`);

  rl.close();
}

main();
