// Copyright 2024-present 650 Industries. All rights reserved.

#ifdef __APPLE__
#include <ExpoModulesJSI/JSIUtils.h>
#else
#include "JSIUtils.h"
#endif

#include "EventEmitter.h"
#include "NativeModule.h"

namespace expo::NativeModule {

void installClass(jsi::Runtime &runtime) {
  jsi::Function eventEmitterClass = EventEmitter::getClass(runtime);
  jsi::Function nativeModuleClass = common::createInheritingClass(runtime, "NativeModule", eventEmitterClass);

  common::getCoreObject(runtime).setProperty(runtime, "NativeModule", nativeModuleClass);
}

} // namespace expo::NativeModule
