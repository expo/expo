// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "CppType.h"
#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class SingleType : public jni::JavaClass<SingleType> {
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/SingleType;";
};

class ExpectedType : public jni::JavaClass<ExpectedType> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/ExpectedType;";

  CppType getCombinedTypes();
};
} // namespace expo
