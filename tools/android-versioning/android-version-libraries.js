'use strict';

const fs = require('fs');
const glob = require('glob-promise');
const readline = require('readline');
const shell = require('shelljs');
const chalk = require('chalk');
const yesno = require('yesno');
const spawnAsync = require('@exponent/spawn-async');
const path = require('path');
const xml2js = require('xml2js');
const { dirSync } = require('tmp');
const { AarTransformer } = require('appc-aar-tools');

const { namespaceExpolibImportsAsync } = require('./android-expolib');
const generateAndCompileSharedObjects = require('./gen-compile-libs');

const DEBUG = process.env.EXPO_DEBUG && process.env.EXPO_DEBUG === 'true';

const NAMESPACE = 'expolib_v1';
const LIBRARIES = [
  {
    group: 'com.squareup.okhttp3',
    name: 'okhttp',
    version: '3.6.0',
  },
  {
    group: 'com.squareup.okhttp3',
    name: 'okhttp-urlconnection',
    version: '3.6.0',
  },
  {
    group: 'com.squareup.okio',
    name: 'okio',
    version: '1.13.0',
  },
  {
    group: 'com.facebook.fresco',
    name: 'imagepipeline-okhttp3',
    version: '1.0.1',
  },
];

const AAR_LIBRARY = {
  group: 'com.facebook.fresco',
  name: 'imagepipeline-okhttp3',
  version: '1.3.0',
};

const AAR_JAR_JAR_RULES_FILE = 'okhttpjarjar.txt';
const GLOBAL_JAR_JAR_RULES_FILE = 'global-jarjar-rules.txt';
const AAR_NAMESPACE = 'expolib_v1';

const ANDROID_DIR = path.join(__dirname, '..', '..', 'android');
const LOCAL_MAVEN_DIR = path.join(ANDROID_DIR, 'maven');
const TOOLS_DIR = path.join(__dirname, '..');
const TEMP_JAR_DIR = path.join(__dirname, 'tmp-jar');
const TEMP_AAR_DIR = path.join(__dirname, 'tmp-aar');

const getDirectories = p => fs.readdirSync(p).filter(f => fs.statSync(p + '/' + f).isDirectory());

async function regexFileAsync(filename, regex, replace) {
  let file = fs.readFileSync(filename);
  let fileString = file.toString();
  fs.writeFileSync(filename, fileString.replace(regex, replace));
}

async function xmlToJSONAsync(xmlString) {
  return new Promise(resolve => {
    xml2js.parseString(xmlString, (_err, result) => {
      resolve(result);
    });
  });
}

async function jsonToXMLAsync(json) {
  let builder = new xml2js.Builder();
  return builder.buildObject(json);
}

function gradleFile(libraries) {
  let deps = '';
  for (let i = 0; i < libraries.length; i++) {
    let library = libraries[i];
    deps += `  runtime group: '${library.group}', name: '${library.name}', version: '${
      library.version
    }'
`;
  }

  return `apply plugin: 'java'

dependencies {
${deps}
}

repositories { mavenCentral() }

task getDeps(type: Copy) {
  from sourceSets.main.runtimeClasspath
  into 'downloaded-jars/'
}
`;
}

async function downloadJarsAsync(libraries) {
  fs.writeFileSync('build.gradle', gradleFile(libraries));
  await spawnAsync(path.join(ANDROID_DIR, 'gradlew'), ['getDeps']);
}

async function getJarFilenameAsync() {
  return await glob('downloaded-jars/*.jar');
}

async function getRootClassNamesAsync(filenames) {
  const BLACKLIST = ['META-INF'];
  let rootClassNames = new Set();

  for (let filename of filenames) {
    let result = await spawnAsync('jar', ['tf', filename]);

    let lines = result.stdout.split('\n');
    for (let line of lines) {
      let rootClassName = line;
      let indexOfSlash = rootClassName.indexOf('/');
      if (indexOfSlash !== -1) {
        rootClassName = rootClassName.substring(0, indexOfSlash);
      }

      if (!BLACKLIST.includes(rootClassName) && rootClassName.length) {
        rootClassNames.add(rootClassName);
      }
    }
  }

  return Array.from(rootClassNames);
}

async function writeJarJarRulesAsync(rootClassNames, namespace) {
  let contents = '';
  for (let rootClassName of rootClassNames) {
    contents += `rule ${rootClassName}.** ${namespace}.${rootClassName}.@1\n`;
  }
  fs.writeFileSync('jarjar-rules.txt', contents);
}

async function writeGlobalJarJarRulesAsync(rootClassNames, namespace) {
  let rootClassNamesSet = new Set(rootClassNames);

  let globalFile = fs.readFileSync(GLOBAL_JAR_JAR_RULES_FILE).toString();
  let globalFileLines = globalFile.split('\n');

  for (let i = 0; i < globalFileLines.length; i++) {
    let line = globalFileLines[i];
    let className = (line.split('rule ')[1] || '').split('.**')[0];
    if (rootClassNamesSet.has(className)) {
      // update namespace
      globalFileLines[i] = `rule ${className}.** ${namespace}.${className}.@1`;
      rootClassNamesSet.delete(className);
    }
  }

  for (let remainingRootClassName of rootClassNamesSet) {
    globalFileLines.push(
      `rule ${remainingRootClassName}.** ${namespace}.${remainingRootClassName}.@1`
    );
  }

  fs.writeFileSync(GLOBAL_JAR_JAR_RULES_FILE, globalFileLines.join('\n'));
}

async function runJarJarAsync(jarFilename, rulesFile = 'jarjar-rules.txt') {
  await spawnAsync('java', [
    '-jar',
    path.join(TOOLS_DIR, 'jarjar-1.4.jar'),
    'process',
    rulesFile,
    jarFilename,
    jarFilename,
  ]);
}

function updatePomXML(object, namespace) {
  const IGNORE_SCOPES = ['provided', 'test'];

  if (!(object instanceof Object)) {
    return object;
  }

  for (let key in object) {
    if (key === 'build') {
      continue;
    }

    if (key === 'groupId') {
      if (object['scope'] && IGNORE_SCOPES.includes(object['scope'][0])) {
        // Don't want to namespace android or find-bugs
        continue;
      }

      for (let i = 0; i < object[key].length; i++) {
        object[key][i] = namespace + '.' + object[key][i];
      }
    } else {
      object[key] = updatePomXML(object[key], namespace);
    }
  }

  return object;
}

async function unzipAAR(aarFilename) {
  try {
    await spawnAsync('rm', ['-rf', TEMP_AAR_DIR]);
  } catch (e) {}

  await spawnAsync('unzip', [aarFilename, '-d', TEMP_AAR_DIR]);
}

async function zipAAR(aarFilename) {
  await spawnAsync('rm', [aarFilename]);
  await spawnAsync('zip', ['-r', path.resolve(aarFilename), '.'], {
    // stdio: 'inherit',
    cwd: TEMP_AAR_DIR,
  });
}

async function fixMavenMetadataAsync(jarFilename, namespace) {
  try {
    await spawnAsync('rm', ['-rf', TEMP_JAR_DIR]);
  } catch (e) {}

  await spawnAsync('unzip', [jarFilename, '-d', TEMP_JAR_DIR]);

  let mavenDirectory = path.join(TEMP_JAR_DIR, 'META-INF', 'maven');
  let groupIds = getDirectories(mavenDirectory);
  if (groupIds.length !== 1) {
    throw new Error(`Found multiple group ids ${groupIds} in maven directory ${mavenDirectory}`);
  }
  let groupId = groupIds[0];
  let namespacedGroupId = namespace + '.' + groupId;

  let artifactIds = getDirectories(path.join(mavenDirectory, groupId));
  if (artifactIds.length !== 1) {
    throw new Error(
      `Found multiple artifact ids ${artifactIds} in maven directory ${mavenDirectory}`
    );
  }
  let artifactId = artifactIds[0];

  let innerMavenDirectory = path.join(mavenDirectory, groupId, artifactId);

  // Update pom.properties
  await regexFileAsync(
    path.join(innerMavenDirectory, 'pom.properties'),
    groupId,
    namespacedGroupId
  );
  let pomProperties = fs.readFileSync(path.join(innerMavenDirectory, 'pom.properties')).toString();
  let version = /version=(\S+)/.exec(pomProperties)[1];
  if (!version) {
    throw new Error(`Can't get version from maven directory ${mavenDirectory}`);
  }

  // Update pom.xml
  let pomXML = await xmlToJSONAsync(
    fs.readFileSync(path.join(innerMavenDirectory, 'pom.xml')).toString()
  );
  pomXML = updatePomXML(pomXML, namespace);
  fs.writeFileSync(path.join(innerMavenDirectory, 'pom.xml'), await jsonToXMLAsync(pomXML));

  // Update groupId in directory structure
  await spawnAsync('mv', [
    path.join(mavenDirectory, groupId),
    path.join(mavenDirectory, namespacedGroupId),
  ]);

  await spawnAsync('rm', [jarFilename]);
  await spawnAsync('zip', ['-r', path.resolve(jarFilename), '.'], {
    // stdio: 'inherit',
    cwd: TEMP_JAR_DIR,
  });

  return {
    groupId: namespacedGroupId,
    artifactId,
    version,
  };
}

function getRelativeMavenPath(groupId, artifactId) {
  return `${groupId.replace(/\./g, '/')}/${artifactId}`;
}

async function installJarToLocalMavenRepoAsync(jarFilename, groupId, artifactId, version) {
  await spawnAsync('mvn', [
    'install:install-file',
    '-e',
    `-Dfile=${jarFilename}`,
    `-DgroupId=${groupId}`,
    `-DartifactId=${artifactId}`,
    `-Dversion=${version}`,
    '-Dpackaging=jar',
  ]);
  let relativeMavenPath = getRelativeMavenPath(groupId, artifactId);
  await spawnAsync('rm', ['-rf', path.join(LOCAL_MAVEN_DIR, relativeMavenPath)]);
  await spawnAsync('mkdir', ['-p', path.join(LOCAL_MAVEN_DIR, relativeMavenPath)]);
  await spawnAsync('cp', [
    '-r',
    path.join(process.env.HOME, '.m2', 'repository', relativeMavenPath) + '/.',
    path.join(LOCAL_MAVEN_DIR, relativeMavenPath),
  ]);
}

async function installAARToLocalMavenRepoAsync(aarFilename, groupId, artifactId, version) {
  if (DEBUG) {
    console.log({ aarFilename, groupId, artifactId, version });
  }

  await spawnAsync('mvn', [
    'install:install-file',
    '-e',
    `-Dfile=${aarFilename}`,
    `-DgroupId=${groupId}`,
    `-DartifactId=${artifactId}`,
    `-Dversion=${version}`,
    '-Dpackaging=aar',
  ]);
  let relativeMavenPath = getRelativeMavenPath(groupId, artifactId);
  await spawnAsync('rm', ['-rf', path.join(LOCAL_MAVEN_DIR, relativeMavenPath)]);
  await spawnAsync('mkdir', ['-p', path.join(LOCAL_MAVEN_DIR, relativeMavenPath)]);
  await spawnAsync('cp', [
    '-r',
    path.join(process.env.HOME, '.m2', 'repository', relativeMavenPath) + '/.',
    path.join(LOCAL_MAVEN_DIR, relativeMavenPath),
  ]);
}

async function cleanupAsync() {
  if (DEBUG === false) {
    try {
      await spawnAsync('rm', ['-rf', 'downloaded-jars']);
    } catch (e) {}

    try {
      await spawnAsync('rm', ['build.gradle']);
    } catch (e) {}

    try {
      await spawnAsync('rm', ['jarjar-rules.txt']);
    } catch (e) {}

    try {
      await spawnAsync('rm', ['-rf', TEMP_JAR_DIR]);
    } catch (e) {}

    try {
      await spawnAsync('rm', ['-rf', TEMP_AAR_DIR]);
    } catch (e) {}
  }
}

exports.versionLibrary = async function versionLibraries() {
  process.chdir(__dirname);

  console.log('Cleaning up');
  await cleanupAsync();
  console.log('Downloading deps');
  await downloadJarsAsync(LIBRARIES);
  console.log('Reading class names');
  let jarFilenames = await getJarFilenameAsync();
  let rootClassNames = await getRootClassNamesAsync(jarFilenames);

  console.log('Writing jarjar rules');
  await writeJarJarRulesAsync(rootClassNames, NAMESPACE);

  for (let jarFilename of jarFilenames) {
    console.log('Running jarjar on ' + jarFilename);
    await runJarJarAsync(jarFilename);

    console.log('Fixing maven metadata for ' + jarFilename);

    try {
      let { groupId, artifactId, version } = await fixMavenMetadataAsync(jarFilename, NAMESPACE);
      console.log(`Installing ${jarFilename} to local maven repo`);
      await installJarToLocalMavenRepoAsync(jarFilename, groupId, artifactId, version);
    } catch (e) {
      console.log(`Issue with fix maven metadata for ${jarFilename} & namespace: ${NAMESPACE}`);
      console.log(e);
    }
  }

  console.log('Writing global jarjar rules used for copying RN');
  await writeGlobalJarJarRulesAsync(rootClassNames, NAMESPACE);

  console.log('Cleaning up');
  await cleanupAsync();
};

exports.runJarJarOnAAR = async function() {
  process.chdir(__dirname);

  console.log('Cleaning up');
  await cleanupAsync();
  console.log('Downloading deps');
  await downloadJarsAsync([AAR_LIBRARY]);

  let aarFilename = `downloaded-jars/${AAR_LIBRARY.name}-${AAR_LIBRARY.version}.aar`;
  console.log(`Unzipping ${aarFilename}`);
  await unzipAAR(aarFilename);

  let jarFilename = `${TEMP_AAR_DIR}/classes.jar`;
  console.log('Running jarjar on ' + jarFilename);
  await runJarJarAsync(jarFilename, AAR_JAR_JAR_RULES_FILE);

  console.log(`Zipping ${aarFilename}`);
  await zipAAR(aarFilename);

  console.log(`Installing ${aarFilename} to local maven repo`);
  await installAARToLocalMavenRepoAsync(
    aarFilename,
    `${AAR_NAMESPACE}.${AAR_LIBRARY.group}`,
    `${AAR_NAMESPACE}-${AAR_LIBRARY.name}`,
    AAR_LIBRARY.version
  );

  console.log('Cleaning up');
  await cleanupAsync();
};

const aarTransform = aarPathAndFilename => {
  return new Promise((resolve, reject) => {
    const transformer = new AarTransformer();
    const { name } = dirSync();
    const options = {
      aarPathAndFilename,
      outputPath: name,
      assetsDestinationPath: `${name}/assets`,
      libraryDestinationPath: `${name}/lib`,
      sharedLibraryDestinationPath: `${name}/jni`,
    };
    transformer.transform(options, (err, result) => {
      resolve({
        result,
        workingDir: { ...options, dir: name },
      });
    });
  });
};

// Prints out what JNI based libs along with their arch that will be
// wrapped
exports.showGeneratedStubs = async ({ src }) => {
  const { result } = await aarTransform(src);
  const willBeWrapped = result.nativeLibraries.map(s => s.split('/')).map(row => {
    const arch = row[row.length - 2];
    const lib = row[row.length - 1];
    return { arch, lib };
  });
  console.log(willBeWrapped);
};

function jarjarMatches(jarjarPath) {
  const jarjarFile = fs.readFileSync(jarjarPath, 'utf-8').trim();
  const lines = jarjarFile.split('\n');
  const subs = [];
  for (const row of lines) {
    const [, orgLib, withPrefix] = row.split(' ');
    const [rootLib] = orgLib.match(/[^\*\*]*/);
    const [prefix] = withPrefix.split('.');
    subs.push({ rootLib, prefix });
  }
  return subs;
}

async function queryDependencies(group, dependencies) {
  const { name: cwd } = dirSync();
  let groupIds = '';
  for (const g of group) groupIds += `"${g}",`;
  const accumDepends = [];
  for (const dep of dependencies) {
    fs.writeFileSync(
      `${cwd}/build.gradle`,
      `
apply plugin: 'java'

dependencies {
  compile '${dep}'
}
repositories { mavenCentral() }

task dumpDepsOfInterest {
  def groupIds = [${groupIds}]
  doLast {
    def componentOfInterest =
      configurations.compile.incoming.resolutionResult.allComponents.find { comp ->
      comp.moduleVersion.group in groupIds
    }
    println componentOfInterest
    if (componentOfInterest != null) {
      def deps = []
      deps.addAll( componentOfInterest.dependencies )

      while(deps.size() > 0) {
        def currDep = deps.pop()
        if (currDep instanceof ResolvedDependencyResult) {
          println currDep.selected.moduleVersion
          deps.addAll(currDep.selected.dependencies)
        } else {
          throw new GradleException("Could not resolve $\{currDep.requested}")
        }
      }
    } else {
      throw new GradleException("Could not find component of interest")
    }
  }
}
`
    );
    const { stdout } = await spawnAsync(`gradle`, ['dumpDepsOfInterest', '-q'], { cwd });
    stdout
      .trim()
      .split('\n')
      .forEach(s => accumDepends.push(s));
  }

  const entries = new Set(accumDepends);
  if (DEBUG) console.log(`Dependencies of ${group}`, entries);
  const depends = [];
  for (const l of entries) {
    const [group, name, version] = l.split(':');
    depends.push({ group, name, version });
  }
  await downloadJarsAsync(depends);
  const withAars = [];
  for (const dep of depends) {
    const pathToAar = `${__dirname}/downloaded-jars/${dep.name}-${dep.version}.aar`;
    const fileExists = fs.existsSync(pathToAar);
    if (fileExists === true) withAars.push({ ...dep, aar: pathToAar });
  }
  return withAars;
}

async function wrapAars(dependencies, wrappedLibs, replacementPatterns, toolchain, apiLevel) {
  return Promise.all(
    dependencies.map(async dependency => {
      const src = path.basename(dependency.aar);
      const aar = await aarTransform(dependency.aar);
      const pkgDirName = path.basename(src.slice(0, src.length - 4));
      const target = `${__dirname}/${wrappedLibs}/${src}`;
      if (DEBUG) {
        console.log({ dependency });
      }
      await generateAndCompileSharedObjects({
        replacementPatterns,
        pkgDirName,
        target,
        toolchain,
        apiLevel,
        aar,
        jarjarRunner: jar => runJarJarAsync(jar, GLOBAL_JAR_JAR_RULES_FILE),
        // This only applies to the JNIEnv methods, first argument of
        // JNIEnv is not passed to the body callback.
        customImpls: [
          {
            method: 'FindClass',
            // Destructured directly here because know the type signature of FindClass
            body: ([{ type, parameterName }], args, real_vm_handle) => {
              return `
JNIEnv *_env_ = NULL;
jint _result_ =
  (*${real_vm_handle})->GetEnv(${real_vm_handle}, (void**)&_env_, JNI_VERSION_1_6);
// This function is provided by libexpohelper.so
const char *versioned_class_path(const char *);
const char *path = versioned_class_path(${parameterName});
if (path == NULL) {
  return (*_env_)->FindClass(_env_, ${parameterName});
} else {
  char p[strlen(path) + 1];
  memcpy(p, path, strlen(path) + 1);
  free(path);
  return (*_env_)->FindClass(_env_, p);
}
              `.trim();
            },
          },
        ],
      });
      return { ...dependency, target };
    })
  );
}

exports.generateSharedObjectWrappers = async ({
  wrapLibraries,
  wrapGroupIds,
  apiLevel,
  toolchain,
  jarjarPath,
}) => {
  if (toolchain === undefined) {
    throw new Error('Must have Android CMake based toolchain from ndk available');
  }
  process.chdir(__dirname);
  const replacementPatterns = jarjarMatches(jarjarPath);
  const pulledAars = await queryDependencies(wrapGroupIds, wrapLibraries);
  console.log(chalk.bold('Queried dependencies'));
  const wrappedLibs = 'wrapped-libs';
  await spawnAsync('mkdir', ['-p', wrappedLibs]);
  const wrappedAars = await wrapAars(
    pulledAars,
    wrappedLibs,
    replacementPatterns,
    toolchain,
    apiLevel
  );
  console.log(chalk.bold('Wrapped aars'));
  for (const { group, name, version, target } of wrappedAars) {
    await installAARToLocalMavenRepoAsync(
      target,
      `${AAR_NAMESPACE}.${group}`,
      `${AAR_NAMESPACE}-${name}`,
      version
    );
  }
  console.log(chalk.bold('Finishing installing aars to local maven repo'));
  await namespaceExpolibImportsAsync(GLOBAL_JAR_JAR_RULES_FILE);
  if (DEBUG === false) {
    const rmArgs = ['-rf', 'build.gradle', wrappedLibs, 'downloaded-jars'];
    await spawnAsync('rm', rmArgs);
  }
  console.log(chalk.bold('Finished generating aar wrappers'));
};
