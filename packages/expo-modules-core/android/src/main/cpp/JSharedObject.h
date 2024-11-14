// Copyright 2021-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class JSharedObject : public jni::JavaClass<JSharedObject> {
public:
  static constexpr const char *kJavaDescriptor = "Lexpo/modules/kotlin/sharedobjects/SharedObject;";
  static auto constexpr TAG = "SharedObject";

  int getId() noexcept;
};

class JSharedRef : public jni::JavaClass<JSharedRef, JSharedObject> {
public:
  static constexpr const char *kJavaDescriptor = "Lexpo/modules/kotlin/sharedobjects/SharedRef;";
  static auto constexpr TAG = "SharedRef";
};

} // namespace expo
