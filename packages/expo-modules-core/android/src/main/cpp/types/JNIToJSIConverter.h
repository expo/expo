// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "../JSIContext.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <optional>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

jsi::Value convert(
  JNIEnv *env,
  jsi::Runtime &rt,
  jni::local_ref<jobject> value
);

/**
 * Convert a string with FollyDynamicExtensionConverter support.
 */
std::optional<jsi::Value> convertStringToFollyDynamicIfNeeded(jsi::Runtime &rt, const std::string& string);

/**
 * Decorate jsi::Value with FollyDynamicExtensionConverter support.
 */
std::optional<jsi::Value> decorateValueForDynamicExtension(jsi::Runtime &rt, const jsi::Value &value);

} // namespace expo
