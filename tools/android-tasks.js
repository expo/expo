'use strict';

const fs = require('fs-extra');
const glob = require('glob-promise');
const readline = require('readline');
const shell = require('shelljs');
const yesno = require('yesno');
const spawnAsync = require('@exponent/spawn-async');
const path = require('path');

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

async function regexFileAsync(filename, regex, replace) {
  let file = await fs.readFile(filename);
  let fileString = file.toString();
  await fs.writeFile(filename, fileString.replace(regex, replace));
}

let savedFiles = {};
async function stashFileAsync(filename) {
  let file = await fs.readFile(filename);
  savedFiles[filename] = file.toString();
}

async function restoreFileAsync(filename) {
  await fs.writeFile(filename, savedFiles[filename]);
}

async function spawnAsyncPrintCommand(command, args = [], other) {
  console.log(`Running ${command} ${args.join(' ')}`);
  await spawnAsync(command, args, other);
}

async function findUnimodules(pkgDir) {
  console.log(`Searching for unimodules in ${pkgDir} directory.`);

  const unimodules = [];

  const unimoduleJsonPaths = await glob(`${pkgDir}/**/unimodule.json`);
  for (const unimoduleJsonPath of unimoduleJsonPaths) {
    const pkgJsonPath = path.join(path.dirname(unimoduleJsonPath), 'package.json');
    const buildGradlePath = path.join(path.dirname(unimoduleJsonPath), 'android', 'build.gradle');
    if ((await fs.pathExists(pkgJsonPath)) && (await fs.pathExists(buildGradlePath))) {
      const unimoduleJson = await fs.readJson(unimoduleJsonPath);
      const pkgJson = await fs.readJson(pkgJsonPath);
      const buildGradle = await fs.readFile(buildGradlePath, 'utf-8');

      const name = unimoduleJson.name;
      const version = buildGradle.match(/^version ?= ?'([\w.-]+)'\n/m)[1] || pkgJson.version;
      const group = buildGradle.match(/^group ?= ?'([\w.]+)'\n/m)[1];

      console.log(`Found module ${group}:${name}:${version}`);

      unimodules.push({ name, group, version });
    }
  }

  return unimodules;
}

exports.updateExpoViewAsync = async function updateExpoViewAsync(sdkVersion) {
  let androidRoot = path.join(process.cwd(), '..', 'android');
  let appBuildGradle = path.join(androidRoot, 'app', 'build.gradle');
  let expoViewBuildGradle = path.join(androidRoot, 'expoview', 'build.gradle');
  const settingsGradle = path.join(androidRoot, 'settings.gradle');
  const constantsJava = path.join(
    androidRoot,
    'expoview/src/main/java/host/exp/exponent/Constants.java'
  );
  const multipleVersionReactNativeActivity = path.join(
    androidRoot,
    'expoview/src/main/java/host/exp/exponent/experience/MultipleVersionReactNativeActivity.java'
  );

  // Modify permanently
  await regexFileAsync(expoViewBuildGradle, /version = '[\d.]+'/, `version = '${sdkVersion}'`);
  await regexFileAsync(
    expoViewBuildGradle,
    /api 'com.facebook.react:react-native:[\d.]+'/,
    `api 'com.facebook.react:react-native:${sdkVersion}'`
  );
  await regexFileAsync(
    path.join(androidRoot, 'ReactAndroid', 'release.gradle'),
    /version = '[\d.]+'/,
    `version = '${sdkVersion}'`
  );
  await regexFileAsync(
    path.join(androidRoot, 'app', 'build.gradle'),
    /host.exp.exponent:expoview:[\d.]+/,
    `host.exp.exponent:expoview:${sdkVersion}`
  );

  await stashFileAsync(appBuildGradle);
  await stashFileAsync(expoViewBuildGradle);
  await stashFileAsync(multipleVersionReactNativeActivity);
  await stashFileAsync(constantsJava);
  await stashFileAsync(settingsGradle);

  // Modify temporarily
  await regexFileAsync(
    constantsJava,
    /TEMPORARY_ABI_VERSION\s*=\s*null/,
    `TEMPORARY_ABI_VERSION = "${sdkVersion}"`
  );
  await regexFileAsync(
    constantsJava,
    `// WHEN_DISTRIBUTING_REMOVE_FROM_HERE`,
    '/* WHEN_DISTRIBUTING_REMOVE_FROM_HERE'
  );
  await regexFileAsync(
    constantsJava,
    `// WHEN_DISTRIBUTING_REMOVE_TO_HERE`,
    'WHEN_DISTRIBUTING_REMOVE_TO_HERE */'
  );
  await regexFileAsync(appBuildGradle, '/* UNCOMMENT WHEN DISTRIBUTING', '');
  await regexFileAsync(appBuildGradle, 'END UNCOMMENT WHEN DISTRIBUTING */', '');
  await regexFileAsync(expoViewBuildGradle, '/* UNCOMMENT WHEN DISTRIBUTING', '');
  await regexFileAsync(expoViewBuildGradle, 'END UNCOMMENT WHEN DISTRIBUTING */', '');
  await regexFileAsync(
    expoViewBuildGradle,
    `// WHEN_DISTRIBUTING_REMOVE_FROM_HERE`,
    '/* WHEN_DISTRIBUTING_REMOVE_FROM_HERE'
  );
  await regexFileAsync(
    expoViewBuildGradle,
    `// WHEN_DISTRIBUTING_REMOVE_TO_HERE`,
    'WHEN_DISTRIBUTING_REMOVE_TO_HERE */'
  );
  await regexFileAsync(
    multipleVersionReactNativeActivity,
    `// WHEN_DISTRIBUTING_REMOVE_FROM_HERE`,
    '/* WHEN_DISTRIBUTING_REMOVE_FROM_HERE'
  );
  await regexFileAsync(
    multipleVersionReactNativeActivity,
    `// WHEN_DISTRIBUTING_REMOVE_TO_HERE`,
    'WHEN_DISTRIBUTING_REMOVE_TO_HERE */'
  );
  await regexFileAsync(
    settingsGradle,
    `// FLAG_BEGIN_REMOVE__UPDATE_EXPOKIT`,
    `/*`
  );
  await regexFileAsync(
    settingsGradle,
    `// FLAG_END_REMOVE__UPDATE_EXPOKIT`,
    `*/ //`
  );

  const detachableUniversalModules = await findUnimodules('../packages');

  // Clear maven local so that we don't end up with multiple versions
  await spawnAsyncPrintCommand('rm', [
    '-rf',
    path.join(process.env.HOME, '/.m2/repository/host/exp/exponent/expoview'),
    ...detachableUniversalModules.map(({ name, group }) =>
      path.join(process.env.HOME, `/.m2/repository/${group.replace(/\./g, '/')}/${name}`)
    ),
  ]);
  await spawnAsyncPrintCommand('rm', [
    '-rf',
    path.join(process.env.HOME, '/.m2/repository/com/facebook/react'),
  ]);
  // expokit-npm-package too
  await spawnAsyncPrintCommand('rm', [
    '-rf',
    path.join(androidRoot, 'maven/host/exp/exponent'),
  ]);
  await spawnAsyncPrintCommand('rm', [
    '-rf',
    path.join(androidRoot, 'maven/com/facebook/react'),
  ]);

  await spawnAsyncPrintCommand('rm', ['-rf', path.join(androidRoot, 'ReactAndroid', 'build')]);
  await spawnAsyncPrintCommand('rm', ['-rf', path.join(androidRoot, 'expoview', 'build')]);
  for (const module of detachableUniversalModules) {
    const { name } = module;
    await spawnAsyncPrintCommand('rm', ['-rf', path.join(androidRoot, '..', 'packages', name, 'android', 'build')]);
  }

  // Build RN and exponent view
  const archivesToUpload = [
    'ReactAndroid',
    ...detachableUniversalModules.map(({ name }) => name),
    'expoview',
  ];

  for (const archiveName of archivesToUpload) {
    await spawnAsyncPrintCommand('./gradlew', [`:${archiveName}:uploadArchives`], {
      cwd: androidRoot,
    });
  }

  await restoreFileAsync(settingsGradle);
  await restoreFileAsync(constantsJava);
  await restoreFileAsync(appBuildGradle);
  await restoreFileAsync(expoViewBuildGradle);
  await restoreFileAsync(multipleVersionReactNativeActivity);

  await spawnAsyncPrintCommand('rm', [
    '-rf',
    path.join(androidRoot, 'maven/host/exp/exponent/expoview'),
    ...detachableUniversalModules.map(({ name, group }) =>
      path.join(androidRoot, `maven/${group.replace(/\./g, '/')}/${name}`)
    ),
  ]);
  await spawnAsyncPrintCommand('mkdir', ['-p', path.join(androidRoot, 'maven/host/exp/exponent')]);
  await spawnAsyncPrintCommand('mkdir', ['-p', path.join(androidRoot, 'maven/org/unimodules')]);

  await spawnAsyncPrintCommand('cp', [
    '-r',
    path.join(process.env.HOME, '/.m2/repository/host/exp/exponent/expoview'),
    path.join(androidRoot, 'maven/host/exp/exponent/expoview'),
  ]);

  for (const { name, group } of detachableUniversalModules) {
    const groupPath = group.replace(/\./g, '/');
    await spawnAsyncPrintCommand('cp', [
      '-r',
      path.join(process.env.HOME, `/.m2/repository/${groupPath}/${name}`),
      path.join(androidRoot, `maven/${groupPath}/`),
    ]);
  }

  await spawnAsyncPrintCommand('rm', ['-rf', path.join(androidRoot, 'maven/com/facebook/react')]);
  await spawnAsyncPrintCommand('cp', [
    '-r',
    path.join(process.env.HOME, '/.m2/repository/com/facebook/react'),
    path.join(androidRoot, 'maven/com/facebook'),
  ]);

  // Copy JSC
  await spawnAsyncPrintCommand('rm', ['-rf', path.join(androidRoot, 'maven/org/webkit/')]);
  await spawnAsyncPrintCommand('cp', [
    '-r',
    path.join(androidRoot, '../node_modules/jsc-android/dist/org/webkit'),
    path.join(androidRoot, 'maven/org/webkit/'),
  ]);
};
