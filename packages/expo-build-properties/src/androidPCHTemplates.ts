export const PCH_CMAKE_CONTENTS = `\
cmake_minimum_required(VERSION 3.16)

project(appmodules)

include(\${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

set(PCH_HEADER "\${CMAKE_CURRENT_SOURCE_DIR}/pch.h")

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

  target_precompile_headers(\${target} PRIVATE
    "$<$<COMPILE_LANGUAGE:CXX>:\${PCH_HEADER}>"
  )
endfunction()

if (DEFINED AUTOLINKED_LIBRARIES)
  foreach (lib IN LISTS AUTOLINKED_LIBRARIES)
    add_pch_if_eligible(\${lib})
  endforeach ()
endif ()
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
