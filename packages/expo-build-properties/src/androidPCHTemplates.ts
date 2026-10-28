export const PCH_CMAKE_CONTENTS = `\
cmake_minimum_required(VERSION 3.16)

project(appmodules)

include(\${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

include("\${CMAKE_CURRENT_SOURCE_DIR}/pch-ccache.cmake")

add_library(appmodules_pch STATIC EXCLUDE_FROM_ALL "\${CMAKE_CURRENT_SOURCE_DIR}/appmodules_pch_owner.cpp")

# Apply the exact same compile options codegen targets get from RN's
target_compile_reactnative_options(appmodules_pch PRIVATE)

# Link dependencies needed by our PCH header
target_link_libraries(appmodules_pch PRIVATE common_flags reactnative jsi folly_runtime fbjni)

# Stop Clang from embedding a build timestamp in the .pch. Without this the PCH
# is non-reproducible across builds, so ccache can't reuse it and dependent
# translation units reject a restored PCH as "modified since built".
target_compile_options(appmodules_pch PRIVATE
  "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>"
)

set(PCH_INCLUDE_OPTION "$<$<COMPILE_LANGUAGE:CXX>:-idirafter\${CMAKE_CURRENT_SOURCE_DIR}>")
target_compile_options(appmodules_pch PRIVATE \${PCH_INCLUDE_OPTION})
target_precompile_headers(appmodules_pch PRIVATE
  "$<$<COMPILE_LANGUAGE:CXX>:<pch.h>>"
)

pch_ccache_owner(appmodules_pch)

function(add_pch_if_eligible target)
  if (NOT TARGET \${target})
    return()
  endif ()

  get_target_property(is_imported \${target} IMPORTED)
  if (is_imported)
    return()
  endif ()

  get_target_property(target_type \${target} TYPE)
  if (target_type STREQUAL "INTERFACE_LIBRARY")
    return()
  endif ()

  # Keep the flag consistent with the PCH owner - see the note above.
  target_compile_options(\${target} PRIVATE
    "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>"
    \${PCH_INCLUDE_OPTION}
  )

  # clang rejects a PCH built with a different C++ dialect, so pin consumers
  # to the owner's -std=c++20 (libraries that set CMAKE_CXX_STANDARD themselves
  # would otherwise get -std=gnu++20).
  set_target_properties(\${target} PROPERTIES CXX_STANDARD 20 CXX_EXTENSIONS OFF)

  target_precompile_headers(\${target} REUSE_FROM appmodules_pch)
  pch_ccache_consumer(\${target} appmodules_pch)
endfunction()

if (DEFINED AUTOLINKED_LIBRARIES)
  foreach (lib IN LISTS AUTOLINKED_LIBRARIES)
    add_pch_if_eligible(\${lib})
  endforeach ()
endif ()
`;

export const PCH_CCACHE_CMAKE_CONTENTS = `\
# Run as custom command
if(CMAKE_SCRIPT_MODE_FILE)
  set(target_option)
  if(COMPILER_TARGET)
    set(target_option "--target=\${COMPILER_TARGET}")
  endif()

  execute_process(
    COMMAND "\${COMPILER}" \${target_option} -module-file-info "\${PCH}"
    OUTPUT_VARIABLE info
    RESULT_VARIABLE result
  )

  if(NOT result EQUAL 0)
    # Hash the .pch itself, which is what ccache does without a .sum. The build stays correct, but
    # checkouts at different paths don't share the results of the users of this PCH.
    message(WARNING "\`\${COMPILER} -module-file-info \${PCH}\` failed, so ccache can't share the results "
      "of the users of this PCH between checkouts at different paths.")
    file(SHA256 "\${PCH}" digest)
    file(WRITE "\${PCH}.sum" "\${digest}\\n")
    return()
  endif()

  # Remove \`ShowColors\` and \`PCH_CCACHE_BUILD_DIR\` 
  string(REGEX REPLACE "PCH_CCACHE_BUILD_DIR=[^\\n]*|ShowColors: [^\\n]*" "" info "\${info}")

  # Get all input files
  string(REGEX MATCHALL "Input file: [^\\n]*" input_files "\${info}")
  foreach(input_file IN LISTS input_files)
    string(REGEX REPLACE "^Input file: | \\\\[[A-Za-z, ]+\\\\]$" "" path "\${input_file}")
    if(EXISTS "\${path}")
      file(SHA256 "\${path}" digest)
      string(APPEND info "\${digest}\\n")
    endif()
  endforeach()

  # Remove base dir
  if(BASE_DIR)
    string(REGEX REPLACE "(.)/+$" "\\\\1" base_dir "\${BASE_DIR}")
    string(REGEX REPLACE "([][+.*()^$?|\\\\\\\\])" "\\\\\\\\\\\\1" base_dir_regex "\${base_dir}")
    # The directory itself or a path in it, followed by a space, a quote or a line break. A directory whose
    # name only starts with the same text doesn't match.
    string(REGEX MATCHALL "\${base_dir_regex}(/[^ '\\n]*)?[ '\\n]" paths "\${info}")
    list(REMOVE_DUPLICATES paths)
    foreach(path IN LISTS paths)
      string(REGEX REPLACE "[ '\\n]$" "" path "\${path}")
      file(RELATIVE_PATH relative_path "\${BUILD_DIR}" "\${path}")
      string(REGEX REPLACE "([][+.*()^$?|\\\\\\\\])" "\\\\\\\\\\\\1" path_regex "\${path}")
      string(REGEX REPLACE "\${path_regex}([ '\\n])" "\${relative_path}\\\\1" info "\${info}")
    endforeach()
  endif()

  string(SHA256 digest "\${info}")
  file(WRITE "\${PCH}.sum" "\${digest}\\n")
  return()
endif()

set(PCH_CCACHE_FILE "\${CMAKE_CURRENT_LIST_FILE}")

# Find ccache program if it's used by the target
function(_pch_ccache_program target out_var)
  get_target_property(launcher \${target} CXX_COMPILER_LAUNCHER)
  get_property(global_rule GLOBAL PROPERTY RULE_LAUNCH_COMPILE)
  get_property(directory_rule DIRECTORY PROPERTY RULE_LAUNCH_COMPILE)
  separate_arguments(rules UNIX_COMMAND "\${global_rule} \${directory_rule}")
  get_filename_component(compiler "\${CMAKE_CXX_COMPILER}" REALPATH)
  foreach(program IN LISTS launcher rules compiler)
    get_filename_component(name "\${program}" NAME_WE)
    if(name STREQUAL "ccache")
      find_program(PCH_CCACHE_PROGRAM NAMES "\${program}")
      set(\${out_var} "\${PCH_CCACHE_PROGRAM}" PARENT_SCOPE)
      return()
    endif()
  endforeach()
  set(\${out_var} "" PARENT_SCOPE)
endfunction()

function(pch_ccache_owner owner)
  # CMake's location of the PCH for the Ninja and Makefile generators.
  set(pch_dir "\${CMAKE_CURRENT_BINARY_DIR}/CMakeFiles/\${owner}.dir")
  set(pch "\${pch_dir}/cmake_pch.hxx.pch")

  # Used by the custom command
  set_property(SOURCE "\${pch_dir}/cmake_pch.hxx.cxx" APPEND PROPERTY
    COMPILE_DEFINITIONS "PCH_CCACHE_BUILD_DIR=\${CMAKE_CURRENT_BINARY_DIR}"
  )

  set(pch_external_checksum "")
  set(base_dir "")
  _pch_ccache_program(\${owner} ccache)
  if(NOT ccache AND "$ENV{EXPO_FORCE_PCH_CCACHE_SUM}")
    # ccache runs through a wrapper, so take its configuration from the ccache on PATH
    find_program(PCH_CCACHE_PATH_PROGRAM ccache)
    set(ccache "\${PCH_CCACHE_PATH_PROGRAM}")
  endif()
  if(ccache)
    foreach(option IN ITEMS pch_external_checksum base_dir)
      execute_process(
        COMMAND "\${ccache}" --get-config \${option}
        OUTPUT_VARIABLE \${option}
        OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
      )
    endforeach()
  endif()

  if("$ENV{EXPO_FORCE_PCH_CCACHE_SUM}")
    set(pch_external_checksum "true")
  endif()

  if(NOT pch_external_checksum STREQUAL "true")
    # Remove the .sum of an earlier configuration: it can belong to an older PCH, and ccache would hash it
    # if \`pch_external_checksum\` is enabled later.
    file(REMOVE "\${pch}.sum")
    return()
  endif()

  add_custom_command(
    OUTPUT "\${pch}.sum"
    COMMAND "\${CMAKE_COMMAND}"
      "-DCOMPILER=\${CMAKE_CXX_COMPILER}"
      "-DCOMPILER_TARGET=\${CMAKE_CXX_COMPILER_TARGET}"
      "-DPCH=\${pch}"
      "-DBASE_DIR=\${base_dir}"
      "-DBUILD_DIR=\${CMAKE_BINARY_DIR}"
      -P "\${PCH_CCACHE_FILE}"
    DEPENDS "\${pch}" "\${PCH_CCACHE_FILE}"
    COMMENT "Writing the ccache checksum of the \${owner} PCH"
    VERBATIM
  )
  add_custom_target(\${owner}-pch-ccache-sum DEPENDS "\${pch}.sum")
endfunction()

function(pch_ccache_consumer consumer owner)
  # ccache reads the .sum when it compiles a source of <consumer>, so it must be written before.
  if(TARGET \${owner}-pch-ccache-sum)
    add_dependencies(\${consumer} \${owner}-pch-ccache-sum)
  endif()
endfunction()
`;

export const PCH_OWNER_SOURCE_CONTENTS = `\
// Translation unit exists solely so the owning target can produce a .pch
// binary that codegen targets reuse.
`;

export const PCH_ONLOAD_CONTENTS = `\
/*
 * Based on https://github.com/facebook/react-native/blob/main/packages/react-native/ReactAndroid/cmake-utils/default-app-setup/OnLoad.cpp
 */

#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <FBReactNativeSpec.h>
#include <autolinking.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

#ifdef REACT_NATIVE_APP_CODEGEN_HEADER
#include REACT_NATIVE_APP_CODEGEN_HEADER
#endif
#ifdef REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#include REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#endif

namespace facebook::react {

void registerComponents(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry) {
#ifdef REACT_NATIVE_APP_COMPONENT_REGISTRATION
  REACT_NATIVE_APP_COMPONENT_REGISTRATION(registry);
#endif

  autolinking_registerProviders(registry);
}

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  return autolinking_cxxModuleProvider(name, jsInvoker);

  return nullptr;
}

std::shared_ptr<TurboModule> javaModuleProvider(
    const std::string& name,
    const JavaTurboModule::InitParams& params) {
#ifdef REACT_NATIVE_APP_MODULE_PROVIDER
  auto module = REACT_NATIVE_APP_MODULE_PROVIDER(name, params);
  if (module != nullptr) {
    return module;
  }
#endif

  if (auto module = FBReactNativeSpec_ModuleProvider(name, params)) {
    return module;
  }

  if (auto module = autolinking_ModuleProvider(name, params)) {
    return module;
  }

  return nullptr;
}

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
        &facebook::react::cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &facebook::react::javaModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            &facebook::react::registerComponents;
  });
}
`;

export const PCH_HEADER_CONTENTS = `\
#pragma once

// RN core headers used across autolinked codegen modules
#include <jsi/jsi.h>
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <react/bridging/Bridging.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/StateData.h>
#include <react/renderer/core/propsConversions.h>
#include <folly/dynamic.h>
`;

export const STUB_PCH_GRADLE_TASK = `\
def cxxDir = project.file(".cxx")
def generateStubPCHTask = tasks.register("generateStubPCH") {
  dependsOn("configureCMakeDebug")

  doLast {
    if (!cxxDir.exists()) {
      return
    }

    cxxDir.eachFileRecurse { file ->
      if (file.name != "compile_commands.json") {
        return
      }

      new groovy.json.JsonSlurper().parseText(file.text).each { entry ->
        if (!entry.file.endsWith("cmake_pch.hxx.cxx")) {
          return
        }

        def pchFile = new File(entry.file.substring(0, entry.file.length() - ".cxx".length()) + ".pch")

        if (!pchFile.exists() || pchFile.length() == 0) {
          pchFile.parentFile.mkdirs()

          def compiler = entry.command.split(" ")[0]
          def target = (entry.command =~ /--target=\\S+/)[0]
          def sysroot = (entry.command =~ /--sysroot=\\S+/)[0]

          def stubHeader = new File(pchFile.parentFile, "stub_pch.hxx")
          stubHeader.text = ""

          def process = new ProcessBuilder(
            compiler,
            target,
            sysroot,
            "-x", "c++-header",
            "-o", pchFile.absolutePath,
            stubHeader.absolutePath
          )
            .directory(new File(entry.directory))
            .redirectErrorStream(true)
            .start()
          process.outputStream.close()
          if (process.waitFor() != 0) {
            throw new GradleException("Stub PCH generation failed: \${process.inputStream.text}")
          }
        }

        pchFile.setLastModified(new File(entry.file).lastModified() - 1)
      }
    }
  }
}

tasks.register("prepareKotlinBuildScriptModel") {
  dependsOn(generateStubPCHTask)
}`;
