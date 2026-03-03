// Copyright © 2025-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

struct JSRunnable : public jni::JavaClass<JSRunnable> {
  constexpr static auto kJavaDescriptor = "Ljava/lang/Runnable;";

  void run() const {
    static auto method = javaClassStatic()->getMethod<void()>("run");
    method(self());
  }
};

} // namespace expo
