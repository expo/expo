// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "../JSIInteropModuleRegistry.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <optional>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

jsi::Value convert(
  JSIInteropModuleRegistry *moduleRegistry,
  JNIEnv *env,
  jsi::Runtime &rt,
  jni::local_ref<jobject> value
);

/**
 * Decorate jsi::Value with FollyDynamicExtensionConverter support.
 */
std::optional<jsi::Value> decorateValueForDynamicExtension(jsi::Runtime &rt, const jsi::Value &value);

} // namespace expo
