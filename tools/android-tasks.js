'use strict';

const fs = require('fs-extra');
const glob = require('glob-promise');
const readline = require('readline');
const shell = require('shelljs');
const yesno = require('yesno');

const LIB_NAMES = [
  'libfb',
  'libfbjni',
  'libfolly_json',
  'libglog_init',
  'glog',
  'reactnativejni',
  'reactnativejnifb',
  'csslayout',
  'yoga',
  'fbgloginit',
  'yogajni',
  'jschelpers',
  'packagerconnectionjnifb',
  'privatedata',
  'yogafastmath',
  'fabricjscjni',
  'jscexecutor',
  'libjscexecutor',
  'jsinspector',
  'libjsinspector',
  'fabricjni',
  'turbomodulejsijni',
];

function renameLib(lib, abiVersion) {
  for (let i = 0; i < LIB_NAMES.length; i++) {
    if (lib.endsWith(LIB_NAMES[i])) {
      return `${lib}_abi${abiVersion}`;
    }
  }

  return lib;
}

function processLine(line, abiVersion) {
  if (
    line.startsWith('LOCAL_MODULE') ||
    line.startsWith('LOCAL_SHARED_LIBRARIES') ||
    line.startsWith('LOCAL_STATIC_LIBRARIES')
  ) {
    let splitLine = line.split(':=');
    let libs = splitLine[1].split(' ');
    for (let i = 0; i < libs.length; i++) {
      libs[i] = renameLib(libs[i], abiVersion);
    }
    splitLine[1] = libs.join(' ');
    line = splitLine.join(':=');
  }

  return line;
}

function processJavaCode(libName, abiVersion) {
  shell.exec(
    `find ../android/versioned-react-native/ReactAndroid/src/main/java -iname '*.java' -type f -print0 | xargs -0 sed -i '' 's/"${libName}"/"${libName}_abi${abiVersion}"/g'`
  );
}

async function processMkFileAsync(filename, abiVersion) {
  let file = await fs.readFile(filename);
  let fileString = file.toString();
  await fs.truncate(filename, 0);
  let lines = fileString.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = processLine(line, abiVersion);
    await fs.appendFile(filename, `${line}\n`);
  }
}

exports.renameJNILibsAsync = async function renameJNILibsAsync(abiVersion) {
  abiVersion = abiVersion.replace(/\./g, '_');

  // Update JNI methods
  let lineReader = readline.createInterface({
    input: fs.createReadStream('android-packages-to-rename.txt'),
  });
  lineReader.on('line', line => {
    let pathForPackage = line.replace(/\./g, '\\/');
    let reactCommonPath = '../android/versioned-react-native/ReactCommon';
    let reactAndroidJNIPath = '../android/versioned-react-native/ReactAndroid/src/main';
    shell.exec(
      `find ${reactCommonPath} ${reactAndroidJNIPath} -type f \\( -name \*.java -o -name \*.h -o -name \*.cpp -o -name \*.mk \\) -print0 | ` +
        `xargs -0 sed -i '' 's/${pathForPackage}/abi${abiVersion}\\/${pathForPackage}/g'`
    );
  });

  // Update LOCAL_MODULE, LOCAL_SHARED_LIBRARIES, LOCAL_STATIC_LIBRARIES fields in .mk files
  let [reactCommonMkFiles, reactAndroidMkFiles] = await Promise.all([
    glob('../android/versioned-react-native/ReactCommon/**/*.mk'),
    glob('../android/versioned-react-native/ReactAndroid/src/main/**/*.mk'),
  ]);
  let filenames = [...reactCommonMkFiles, ...reactAndroidMkFiles];
  await Promise.all(filenames.map(filename => processMkFileAsync(filename, abiVersion)));

  // Rename references to JNI libs in Java code
  for (let i = 0; i < LIB_NAMES.length; i++) {
    let libName = LIB_NAMES[i];
    processJavaCode(libName, abiVersion);
  }

  // 'fbjni' is loaded without the 'lib' prefix in com.facebook.jni.Prerequisites
  processJavaCode('fbjni', abiVersion);
  processJavaCode('fb', abiVersion);

  console.log('\n\nThese are the JNI lib names we modified:');
  shell.exec(
    `find ../android/versioned-react-native/ReactAndroid/src/main/java -name "*.java" | xargs grep -i "_abi${abiVersion}"`
  );

  console.log('\n\nAnd here are all instances of loadLibrary:');
  shell.exec(
    `find ../android/versioned-react-native/ReactAndroid/src/main/java -name "*.java" | xargs grep -i "loadLibrary"`
  );

  console.log('\n');
  let isCorrect = await yesnoPromise('Does all that look correct? (yes/no)');
  if (!isCorrect) {
    throw new Error('Fix JNI libs');
  }
};

function yesnoPromise(question) {
  return new Promise(resolve => {
    yesno.ask(question, null, ok => {
      // yesno lib doesn't properly shut down. without this the command won't exit
      process.stdin.pause();

      resolve(ok);
    });
  });
}
