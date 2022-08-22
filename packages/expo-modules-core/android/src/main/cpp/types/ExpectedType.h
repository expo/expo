// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "CppType.h"
#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

/**
 * A C++ representation of the [expo.modules.kotlin.jni.SingleType] class.
 */
class SingleType : public jni::JavaClass<SingleType> {
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/SingleType;";
};

/**
 * A C++ representation of the [expo.modules.kotlin.jni.ExpectedType] class.
 */
class ExpectedType : public jni::JavaClass<ExpectedType> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/ExpectedType;";

  CppType getCombinedTypes();
};
} // namespace expo
