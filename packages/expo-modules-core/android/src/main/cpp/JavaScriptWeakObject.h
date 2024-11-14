// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include "JNIDeallocator.h"
#include "JavaScriptObject.h"
#include "WeakRuntimeHolder.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

class JavaScriptObject;

/**
 * Represents to a jsi::WeakObject.
 */
class JavaScriptWeakObject
    : public jni::HybridClass<JavaScriptWeakObject, Destructible> {
public:
  static auto constexpr kJavaDescriptor =
      "Lexpo/modules/kotlin/jni/JavaScriptWeakObject;";
  static auto constexpr TAG = "JavaScriptWeakObject";

  static void registerNatives();

  static jni::local_ref<
      jni::HybridClass<JavaScriptWeakObject, Destructible>::javaobject>
  newInstance(JSIContext *jSIContext,
              std::weak_ptr<JavaScriptRuntime> runtime,
              std::shared_ptr<jsi::Object> jsObject);

  jni::local_ref<JavaScriptObject::javaobject> lock();

  std::shared_ptr<jsi::WeakObject> getWeak();

private:
  JavaScriptWeakObject(WeakRuntimeHolder runtime,
                       std::shared_ptr<jsi::Object> jsObject);

private:
  friend HybridBase;

  WeakRuntimeHolder _runtimeHolder;
  std::shared_ptr<jsi::WeakObject> _weakObject;
};

} // namespace expo
