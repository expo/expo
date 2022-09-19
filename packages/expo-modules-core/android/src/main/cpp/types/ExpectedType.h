// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "CppType.h"
#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class ExpectedType;

/**
 * A C++ representation of the [expo.modules.kotlin.jni.SingleType] class.
 */
class SingleType : public jni::JavaClass<SingleType> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/SingleType;";

  CppType getCppType();

  jni::local_ref<jni::JavaClass<ExpectedType>::javaobject> getFirstParameterType();

  jni::local_ref<jni::JavaClass<ExpectedType>::javaobject> getSecondParameterType();
};

/**
 * A C++ representation of the [expo.modules.kotlin.jni.ExpectedType] class.
 */
class ExpectedType : public jni::JavaClass<ExpectedType> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/ExpectedType;";

  CppType getCombinedTypes();

  jni::local_ref<SingleType::javaobject> getFirstType();

  /**
   * Converts [ExpectedType] to a string representing a java class.
   * If the allowsPrimitives is set to true type like int will be represented as a primitives.
   */
  std::string getJClassString(bool allowsPrimitives = false);

  jni::local_ref<jni::JArrayClass<SingleType>::javaobject> getPossibleTypes();
};
} // namespace expo
