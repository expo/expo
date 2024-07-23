// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class Destructible : public jni::JavaClass<Destructible> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/Destructible;";
};

class JNIDeallocator : public jni::JavaClass<JNIDeallocator> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/JNIDeallocator;";

  void addReference(
    jni::local_ref<Destructible::javaobject> jniObject
  ) noexcept;
};

} // namespace expo
