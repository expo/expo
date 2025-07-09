// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "ExpectedType.h"
#include "FrontendConverter.h"

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {
class JSIContext;

/**
 * Holds information about the expected Kotlin type.
 */
class AnyType {
public:
  AnyType(jni::local_ref<ExpectedType> expectedType);

  /*
   * An instance of convert that should be used to convert from the jsi to the expected JNI type.
   */
  std::shared_ptr<FrontendConverter> converter;
};
} // namespace expo
