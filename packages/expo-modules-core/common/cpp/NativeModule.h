// Copyright 2024-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <jsi/jsi.h>

#include "JSIUtils.h"

namespace jsi = facebook::jsi;

namespace expo::NativeModule {

/**
 Gets `expo.NativeModule` class in the given runtime.
 */
inline jsi::Function getClass(jsi::Runtime &runtime) {
  return common::getCoreObject(runtime).getPropertyAsFunction(runtime, "NativeModule");
}

/**
 Installs `expo.NativeModule` class in the given runtime.
 */
void installClass(jsi::Runtime &runtime);

/**
 Creates a new instance of the native module.
 */
inline jsi::Object createInstance(jsi::Runtime &runtime) {
  return getClass(runtime).callAsConstructor(runtime).getObject(runtime);
}

} // namespace expo::NativeModule

#endif // __cplusplus
