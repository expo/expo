'use strict';

import 'instapromise';

import fs from 'fs';
import shell from 'shelljs';

async function modifyIOSPropertyListAsync(plistPath, plistName, transform) {
  let configPlistName = `${plistPath}/${plistName}.plist`;
  let configFilename = `${plistPath}/${plistName}.json`;

  // grab original plist as json object
  shell.exec(`plutil -convert json ${configPlistName} -o ${configFilename}`);
  let configContents = await fs.promise.readFile(configFilename, 'utf8');
  let config;

  try {
    config = JSON.parse(configContents);
  } catch (e) {
    console.log(`Error parsing ${configFilename}`, e);
    console.log('The erroneous file contents was:', configContents);
    config = {};
  }

  // apply transformation
  config = transform(config);

  // back up old plist and swap in modified one
  shell.exec(`cp ${configPlistName} ${configPlistName}.bak`);
  await fs.promise.writeFile(configFilename, JSON.stringify(config));
  shell.exec(`plutil -convert xml1 ${configFilename} -o ${configPlistName}`);
}

async function cleanIOSPropertyListBackupAsync(plistPath, plistName, restoreOriginal = true) {
  let configPlistName = `${plistPath}/${plistName}.plist`;
  let configFilename = `${plistPath}/${plistName}.json`;

  let cleanupTasks = [
    `rm ${configPlistName}.bak`,
    `rm ${configFilename}`,
  ];

  if (restoreOriginal) {
    cleanupTasks = [`cp ${configPlistName}.bak ${configPlistName}`].concat(cleanupTasks);
  }

  let cleanupTasksCmd = cleanupTasks.join(' && ');
  console.log(cleanupTasksCmd);
  shell.exec(cleanupTasksCmd);
}

export {
  modifyIOSPropertyListAsync,
  cleanIOSPropertyListBackupAsync,
};
