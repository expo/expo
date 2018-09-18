'use strict';

const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);
const mkdir = promisify(require('fs').mkdir);
const { mv, rm, cp } = require('shelljs');
const spawnAsync = require('@exponent/spawn-async');
const { dirSync } = require('tmp');
const { dirname } = require('path');
const chalk = require('chalk');
const { expo_jni_native_jni, expo_jni_invoke_jni } = require('./jni-headers');

const signatureRegex = /^(\w[\w\s*]*)\(JNICALL \*([^()]+)\)\(([^()]+)\);/;

const EXPO_ENV_HANDLE = 'envPtrPtr';

const libexpohelper = 'libexpohelper.so';

const DEBUG = process.env.EXPO_DEBUG && process.env.EXPO_DEBUG === 'true';

const androidLog = (justLib, commit) => `
#include <android/log.h>

#define LOGF(...) \
  __android_log_print(ANDROID_LOG_FATAL, "EXPO-${justLib}-${commit}", __VA_ARGS__)

#ifdef _DEBUG
  #define LOGIFDEBUG(...) \
    __android_log_print(ANDROID_LOG_DEBUG, "EXPO-${justLib}-${commit}", __VA_ARGS__)
#else
  #define LOGIFDEBUG(...)
#endif
`;

const signatures = expo_jni_native_jni
  .split('\n')
  .map(s => s.trim())
  .map(produceParts);

const functionPointers = signatures
  .map(({ fpName }) => `  (*${EXPO_ENV_HANDLE})->${fpName} = ${fpName}_wrapper;`)
  .join('\n')
  .trim();

function produceParts(line, lc) {
  try {
    const [, returnT, fpName, argList] = line.match(signatureRegex);
    const params = argList.split(',').map(s => s.trim());
    const trailingEllipsis = params[params.length - 1] === '...';
    const splitOver = trailingEllipsis === true ? params.slice(0, params.length - 1) : params;
    const typesAndParams = splitOver.map(s => {
      const parts = s.split(' ');
      const parameterName = parts[parts.length - 1];
      const type = parts.slice(0, parts.length - 1).reduce((a, b) => `${a} ${b}`);
      return { parameterName, type };
    });
    if (trailingEllipsis === true) {
      typesAndParams.push({ parameterName: '...', type: null });
    }
    return { line, returnT, fpName, typesAndParams, trailingEllipsis };
  } catch (e) {
    console.error({ REASON: 'BAD INPUT DATA', e, line, lc });
    return process.exit(-1);
  }
}

const argList = typesAndParams =>
  typesAndParams
    .map(
      ({ parameterName, type }) =>
        parameterName !== '...' ? `${type} ${parameterName}` : `${parameterName}`
    )
    .join(', ');

const withoutStars = s => {
  let spot = 0;
  while (true) {
    if (s[spot] === '*') spot++;
    else break;
  }
  return s.slice(spot, s.length);
};

const generateWrapperFunctions = (config, commit) => {
  const customImpls = new Map(config.customImpls.map(impl => [impl.method, impl]));
  const wrappers = [];
  for (const { returnT, fpName, typesAndParams, trailingEllipsis } of signatures) {
    let args = typesAndParams.map(({ parameterName }) => withoutStars(parameterName));
    args[0] = '_env_';

    if (customImpls.has(fpName) === true) {
      const params = typesAndParams
        .slice(1, typesAndParams.length)
        .map(({ parameterName, type }) => ({
          type,
          parameterName: withoutStars(parameterName),
        }));

      wrappers.push(`
${returnT} ${fpName}_wrapper(${argList(typesAndParams)}) {
  ${customImpls.get(fpName).body(params, args, 'real_vm_handle')}
}
`);
    } else {
      if (trailingEllipsis === true) {
        args.pop();
      }
      const joinedArgs = args.join(', ');
      if (trailingEllipsis === false) {
        wrappers.push(
          `
${returnT} ${fpName}_wrapper(${argList(typesAndParams)}) {
  LOGIFDEBUG("%s called", __func__);
  JNIEnv *_env_ = NULL;
  jint _result_ = (*real_vm_handle)->GetEnv(real_vm_handle, (void**)&_env_, JNI_VERSION_1_6);
  if (_env_ == NULL) {
    LOGF("%s has NULL pointer for its JNIEnv, universe: ${commit}", __func__);
  }
  ${returnT === 'void' ? '' : 'return'} (*_env_)->${fpName}(${args});
}
`.trim()
        );
      } else {
        wrappers.push(
          `
${returnT} ${fpName}_wrapper(${argList(typesAndParams)}) {
  LOGIFDEBUG("%s", __func__);
  ${returnT === 'void' ? '' : `${returnT} result;`}
  va_list myargs;
  JNIEnv *_env_ = NULL;
  jint _result_ = (*real_vm_handle)->GetEnv(real_vm_handle, (void**)&_env_, JNI_VERSION_1_6);
  va_start(myargs, ${args[args.length - 1]});
  ${returnT === 'void' ? '' : 'result ='} (*_env_)->${fpName}V(${joinedArgs}, myargs);
  va_end(myargs);
  ${returnT === 'void' ? '' : 'return result'};
}`.trim()
        );
      }
    }
  }

  return wrappers.join('\n');
};

let _shown_generated_library_code = false;
let _shown_generated_helper_code = false;

/**
  Process: We make struct definitions that mirror the original
  definitions of JavaVM and JNIEnv, this is so the ABI is the same but
  we have ability to write to memory for the function pointers. We
  maintain a handle on JavaVM given to us by OnLoad but then maintain
  a proxy handle for the library we are wrapping. So when that wrapped
  library tries using something from JNIEnv, it will really be calling
  one of our functions. This gives us a chance to hook whatever JNI
  API we want to in any compiled JNI code.
*/
const generateCFile = async ({ config, workingDirectory, commit }) => {
  const src = `${workingDirectory.name}/src`;
  const [justLib] = config.lib.split('.');
  const orgLib = `${justLib}-original.so`;
  const stubs = `${src}/stubs.c`;
  await mkdir(src);
  await writeFile(
    stubs,
    `
// Generated on ${new Date().toLocaleString()}
#include <dlfcn.h>
#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
${androidLog(justLib, commit)}
// These struct MUST come before the typedefs for code to compile
struct expo_jni_native_jni {
  void *reserved0; void *reserved1; void *reserved2; void *reserved3;
  ${expo_jni_native_jni}
};

struct expo_jni_invoke_jni {
  void *reserved0; void *reserved1; void *reserved2;
  ${expo_jni_invoke_jni}
};

typedef struct expo_jni_native_jni *ExpoJNIEnv;
typedef struct expo_jni_invoke_jni *ExpoJavaVM;

static ExpoJavaVM *expo_vm_handle = NULL;
static JavaVM *real_vm_handle = NULL;
static jint (*wrapped_library_onload)(JavaVM *, void *) = NULL;
static void *handle_on_real_library = NULL;

__attribute__((constructor(101))) void grab(void) {
  handle_on_real_library = dlopen("${orgLib}", RTLD_NOW);
  wrapped_library_onload = dlsym(handle_on_real_library, "JNI_OnLoad");
  ExpoJavaVM expo_vm_ptr = malloc(sizeof(*expo_vm_ptr));
  expo_vm_handle = malloc(sizeof(ExpoJavaVM));
  *expo_vm_handle = expo_vm_ptr;
  LOGIFDEBUG("Real Lib at: %p, Onload at: %p, expo_vm_handle at %p",
             handle_on_real_library,
             wrapped_library_onload,
             expo_vm_handle);
}

${generateWrapperFunctions(config, commit)}

jint JNICALL DestroyJavaVM_wrapper(JavaVM *vm) {
  LOGIFDEBUG("%s", __func__);
  return (*real_vm_handle)->DestroyJavaVM(real_vm_handle);
}

jint JNICALL AttachCurrentThread_wrapper(JavaVM *vm, void **penv, void *args) {
  LOGIFDEBUG("%s", __func__);
  return (*real_vm_handle)->AttachCurrentThread(real_vm_handle, (JNIEnv **)penv, args);
}

jint JNICALL DetachCurrentThread_wrapper(JavaVM *vm) {
  LOGIFDEBUG("%s", __func__);
  return (*real_vm_handle)->DetachCurrentThread(real_vm_handle);
}

jint JNICALL AttachCurrentThreadAsDaemon_wrapper(JavaVM *vm, void **penv, void *args) {
  LOGIFDEBUG("%s", __func__);
  return (*real_vm_handle)->AttachCurrentThreadAsDaemon(real_vm_handle, (JNIEnv **)penv, args);
}

jint GetEnv_wrapper(JavaVM *vm, void **penv, jint version) {
  LOGIFDEBUG("%s", __func__);
  ExpoJNIEnv envPtr = malloc(sizeof(*envPtr));
  ExpoJNIEnv *${EXPO_ENV_HANDLE} = malloc(sizeof(ExpoJNIEnv));
  *${EXPO_ENV_HANDLE} = envPtr;
  jint result = (*real_vm_handle)->GetEnv(real_vm_handle, (void**)penv, version);
  memcpy(envPtr, *penv, sizeof(*envPtr));
  ${functionPointers}
  *penv = ${EXPO_ENV_HANDLE};
  return result;
}

__attribute__((visibility("default")))
jint JNI_OnLoad(JavaVM *vm, void *aReserved) {
  LOGIFDEBUG("%s", __func__);
  real_vm_handle = vm;
  (*expo_vm_handle)->DestroyJavaVM = DestroyJavaVM_wrapper;
  (*expo_vm_handle)->AttachCurrentThread = AttachCurrentThread_wrapper;
  (*expo_vm_handle)->DetachCurrentThread = DetachCurrentThread_wrapper;
  (*expo_vm_handle)->GetEnv = GetEnv_wrapper;
  (*expo_vm_handle)->AttachCurrentThreadAsDaemon = AttachCurrentThreadAsDaemon_wrapper;
  jint final_result = wrapped_library_onload((JavaVM *)expo_vm_handle, aReserved);
  if (final_result == JNI_ERR) {
    LOGF("Wrapped library gave back JNI_ERR");
  } else if (final_result == JNI_VERSION_1_6) {
    LOGIFDEBUG("Wrapped onload returned that its using 1.6 JNI");
  }
  LOGIFDEBUG("Real VM at: %p", vm);
  return final_result;
}
`.trimLeft()
  );
  if (DEBUG && _shown_generated_library_code === false) {
    console.log(chalk.green(await readFile(stubs, 'utf8')));
    _shown_generated_library_code = true;
  }
  return stubs;
};

const generateCMakeFile = async ({ stubs, workingDirectory, lib }) => {
  const cmakeFile = `${workingDirectory.name}/CMakeLists.txt`;
  // Get rid of lib and .so
  const libName = lib.slice(3, lib.length - 3);
  // We assume that libexpohelper.so will be put in same directory as
  // the build dir
  const quiet = '-Wno-incompatible-pointer-types-discards-qualifiers';
  const cflags = `${quiet} ${DEBUG ? '-D_DEBUG -ggdb' : ''}`;
  const linkerFlags = `-Wlsoname,${lib} -fpic`;
  await writeFile(
    cmakeFile,
    `
# Generated on ${new Date().toLocaleString()}
cmake_minimum_required(VERSION 3.6)
add_library(${libName} SHARED $\{PROJECT_SOURCE_DIR}/src/stubs.c)
set (CMAKE_C_STANDARD 11)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
SET_SOURCE_FILES_PROPERTIES(stubs.c PROPERTIES LANGUAGE C)
set(CMAKE_C_FLAGS "$\{CMAKE_C_FLAGS} ${cflags}")
set(CMAKE_SHARED_LINKER_FLAGS "$\{CMAKE_SHARED_LINKER_FLAGS} ${linkerFlags}")
set(EXPOHELPER "$\{PROJECT_SOURCE_DIR}/${libexpohelper}")
target_link_libraries(${libName} android log $\{EXPOHELPER})
`.trim()
  );
  return cmakeFile;
};

const compileGeneratedCode = async ({ workingDirectory, config }) => {
  const args = [
    `-DCMAKE_TOOLCHAIN_FILE=${config.toolchain}`,
    `-DANDROID_NATIVE_API_LEVEL='${config.apiLevel}'`,
    `-DANDROID_ABI='${config.arch}'`,
    `-DCMAKE_BUILD_TYPE=Release`,
    `-Wno-dev`,
    `${workingDirectory.name}`,
  ];
  const cmake = await spawnAsync('cmake', args, {
    cwd: workingDirectory.name,
    env: { ...process.env, VERBOSE: '1' },
  });
  if (DEBUG) {
    if (cmake.stderr !== '') console.warn(chalk.yellow(cmake.stderr));
  }
  const make = await spawnAsync('make', [], {
    cwd: workingDirectory.name,
  });
  if (DEBUG) {
    if (make.stderr !== '') console.warn(chalk.yellow(make.stderr));
  }
  const finalLibrary = `${workingDirectory.name}/${config.lib}`;
  return finalLibrary;
};

/**
  We make a separate expohelper library because having the power of
C++ is nice and its preferable to keep compiling the wrappers as plain
C.
*/
const generateHelperLib = async (replacementPatterns, commit) => {
  const workingDirectory = dirSync({ keep: DEBUG });
  const src = `${workingDirectory.name}/src`;
  const stubs = `${src}/stubs.cpp`;
  const cmakeFile = `${workingDirectory.name}/CMakeLists.txt`;
  await mkdir(src);
  const pairs = replacementPatterns
    .map(
      ({ rootLib, prefix }) =>
        `  pairs.push_back(std::vector<std::string>{"${rootLib}*", "${prefix}."})`
    )
    .join(';\n');
  const debugMacros = androidLog('libexpohelper', commit);
  await writeFile(
    stubs,
    `
#include <regex>
#include <string>
#include <vector>

${debugMacros}

extern "C" {

static const char *h = "\\\\.";

const char* versioned_class_path(const char *name) {
  std::string with_dots = std::regex_replace(name, std::regex{"/"}, ".");
  std::vector<std::vector<std::string>> pairs;
${pairs};

  for (auto &pair : pairs) {
    LOGIFDEBUG("Checking: %s with %s", with_dots.c_str(), pair[0].c_str());
    bool match = std::regex_match(with_dots, std::regex{pair[0]});
    if (match == true) {
      std::string versioned = pair[1] + with_dots;
      std::string s = std::regex_replace(versioned, std::regex{h}, "/");
      void *result = malloc(strlen(s.c_str()) + 1);
      memcpy(result, s.c_str(), strlen(s.c_str()) + 1);
      const char *r = static_cast<const char*>(result);
      LOGIFDEBUG("Replacing:%s with %s", name, r);
      return r;
    }
  }
  return NULL;
}

}
`
  );
  const linkerFlags = `-fpic -s -O3 -flto -fuse-ld=gold -Wl,--icf=safe`;
  const cflags = DEBUG ? '-D_DEBUG -ggdb' : '';
  const optimize = `-Oz -fno-exceptions -fno-rtti -fno-stack-protector`;
  await writeFile(
    cmakeFile,
    `
cmake_minimum_required(VERSION 3.6)
set (CMAKE_CXX_STANDARD 11)
add_library(expohelper SHARED $\{PROJECT_SOURCE_DIR}/src/stubs.cpp)
SET_SOURCE_FILES_PROPERTIES(stubs.cpp PROPERTIES LANGUAGE CXX)
set(CMAKE_CXX_FLAGS "$\{CMAKE_CXX_FLAGS} ${cflags}")
target_compile_options(expohelper PRIVATE ${optimize})
set(CMAKE_SHARED_LINKER_FLAGS "$\{CMAKE_SHARED_LINKER_FLAGS} ${linkerFlags}")
target_link_libraries(expohelper android log)
`
  );
  if (DEBUG && _shown_generated_helper_code === false) {
    console.log(chalk.cyan(await readFile(stubs, 'utf8')));
    _shown_generated_helper_code = true;
  }
  return workingDirectory.name;
};

const compileHelperLib = async (arch, dir, toolchain, apiLevel) => {
  const args = [
    `-DCMAKE_TOOLCHAIN_FILE=${toolchain}`,
    `-DANDROID_NATIVE_API_LEVEL='${apiLevel}'`,
    `-DANDROID_ABI='${arch}'`,
    `-DCMAKE_BUILD_TYPE=Release`,
    `-Wno-dev`,
    `${dir}`,
  ];
  if (DEBUG) {
    console.log({ args: args.join(' '), dir });
  }
  try {
    await spawnAsync('cmake', args, { cwd: dir });
    await spawnAsync('make', [], { cwd: dir });
  } catch ({ message }) {
    throw new Error(`Issue with building helper library ${message}`);
  }
  return `${dir}/${libexpohelper}`;
};

const buildWrappers = async (wrapThese, otherConfig, replacementPatterns, commit) => {
  const helperLibDir = await generateHelperLib(replacementPatterns, commit);
  return await Promise.all(
    wrapThese.map(async ({ arch, lib, dirname }) => {
      const helperLibScratchPad = dirSync({ keep: DEBUG });
      // We need to make separate cps because of the different archs
      cp('-R', `${helperLibDir}/*`, helperLibScratchPad.name);
      if (DEBUG) {
        console.log(`Helper lib for ${arch} built in: ${helperLibScratchPad.name}`);
      }
      const expoHelperLib = await compileHelperLib(
        arch,
        helperLibScratchPad.name,
        otherConfig.toolchain,
        otherConfig.apiLevel
      );
      const workingDirectory = dirSync({ keep: DEBUG });
      mv(expoHelperLib, workingDirectory.name);
      const stubs = await generateCFile({
        config: { ...otherConfig, lib },
        workingDirectory,
        commit,
      });
      const cmake = await generateCMakeFile({
        lib,
        workingDirectory,
        stubs,
      });
      let finalLibraryPath = null;
      // Definitely crap out if we have compliation errors.
      try {
        finalLibraryPath = await compileGeneratedCode({
          config: { ...otherConfig, arch, lib },
          workingDirectory,
        });
      } catch ({ message }) {
        console.error(message);
        process.exit(1);
      }
      return {
        arch,
        helperLib: `${workingDirectory.name}/${libexpohelper}`,
        finalLibraryPath,
        lib,
      };
    })
  );
};

const updateManifest = async (cwd, pkgName) => {
  const manifest = `${cwd}/AndroidManifest.xml`;
  await spawnAsync('sed', ['-i', '', `s/${pkgName}/expolib_v1.${pkgName}/g`, manifest], {
    cwd,
  });
};

const patchOriginalAar = async (aarPathAndFilename, builtLibs, target, pkgName, jarjarRunner) => {
  const { name: cwd } = dirSync();
  await spawnAsync('unzip', ['-d', '.', aarPathAndFilename], { cwd });
  for (const { arch, helperLib, finalLibraryPath, lib } of builtLibs) {
    const orgLib = `${cwd}/jni/${arch}/${lib}`;
    const [justLib] = lib.split('.');
    const sideBySide = `${cwd}/jni/${arch}/${justLib}-original.so`;
    mv(orgLib, sideBySide);
    mv(finalLibraryPath, `${cwd}/jni/${arch}`);
    mv(helperLib, `${cwd}/jni/${arch}`);
  }
  await updateManifest(cwd, pkgName);
  await jarjarRunner(`${cwd}/classes.jar`);
  await spawnAsync('zip', ['-r', target, '.'], { cwd });
};

/** Idea: We have two .so, A & B. A will gets loaded by the Java side
  and has its own JNI_OnLoad called. While A is being loaded, it grabs
  a handle to B's JNI_OnLoad function. So that we call B's OnLoad but
  with our, A's, JavaVM and hence our JNIEnv. This way we can hook any
  function of the JNI API that B will use and hence we can hook
  functions like FindClass which is provided by caller.

  We put A right next to B in B's respective aar and name A to B's
  original name, hence whatever was going to use B will now call A
  instead.

  Only time to update this code is if there is a bug in the C Code
  generation or if the JNI changes which is seldom.
*/
module.exports = async config => {
  const { aar, jarjarRunner, replacementPatterns, pkgDirName, target, ...otherConfig } = config;
  let wrapThese = [];
  const { stdout } = await spawnAsync('git', ['rev-parse', '--short', '--verify', 'HEAD']);
  const commit = stdout.trim();
  for (const libPath of aar.result.nativeLibraries) {
    const pathParts = libPath.split('/');
    const lib = pathParts[pathParts.length - 1];
    const arch = pathParts[pathParts.length - 2];
    wrapThese.push({
      dirname: dirname(libPath),
      lib,
      arch,
    });
  }
  const archLibs = await buildWrappers(wrapThese, otherConfig, replacementPatterns, commit);
  const { aarPathAndFilename } = aar.workingDir;
  await patchOriginalAar(
    aarPathAndFilename,
    archLibs,
    target,
    aar.result.packageName,
    jarjarRunner
  );
};
