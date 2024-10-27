// Copyright 2024-present 650 Industries. All rights reserved.

#include "JSIUtils.h"
#include "EventEmitter.h"
#include "NativeModule.h"

namespace expo::NativeModule {

void installClass(jsi::Runtime &runtime) {
  jsi::Function eventEmitterClass = EventEmitter::getClass(runtime);
  jsi::Function nativeModuleClass = common::createInheritingClass(runtime, "NativeModule", eventEmitterClass);

  common::getCoreObject(runtime).setProperty(runtime, "NativeModule", nativeModuleClass);
}

} // namespace expo::NativeModule
