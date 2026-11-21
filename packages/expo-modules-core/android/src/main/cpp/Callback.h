// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "ExpoHeader.pch"
#include "CallbackContext.h"
#include "JNIDeallocator.h"

#include <fbjni/detail/CoreClasses.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

class JSIContext;

/**
 * Every invocation is posted to the JS thread. Invocations after the runtime is gone are dropped.
 * The callback context is released when the Kotlin object is garbage collected or when the runtime
 * tears down, whichever happens first.
 */
class Callback : public jni::HybridClass<Callback, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/Callback;";
  static auto constexpr TAG = "Callback";

  static void registerNatives();

  static jni::local_ref<Callback::javaobject> newInstance(
    JSIContext *jsiContext,
    std::shared_ptr<CallbackContext> callbackContext
  );

  ~Callback();

private:
  // Weak because only the JS thread may own a LongLivedObject.
  std::weak_ptr<CallbackContext> callbackContext;

  friend HybridBase;

  explicit Callback(std::shared_ptr<CallbackContext> callbackContext);

  void invokeNative(jni::alias_ref<jni::JArrayClass<jobject>> args);
};

} // namespace expo
