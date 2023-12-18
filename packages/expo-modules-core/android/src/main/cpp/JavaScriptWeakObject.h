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
 * Represents JavaScript WeakRef to an jsi::Object.
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
  newInstance(JSIInteropModuleRegistry *jsiInteropModuleRegistry,
              std::weak_ptr<JavaScriptRuntime> runtime,
              std::shared_ptr<jsi::Object> jsObject);

  jni::local_ref<JavaScriptObject::javaobject> lock();

  // #region WeakRef runtime helpers (fallback when jsi::WeakObject is not
  // available).

  static bool isWeakRefSupported(jsi::Runtime &runtime);
  static std::shared_ptr<jsi::Object>
  createWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object);
  static std::shared_ptr<jsi::Object>
  derefWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object);

  // #endregion

private:
  JavaScriptWeakObject(WeakRuntimeHolder runtime,
                       std::shared_ptr<jsi::Object> jsObject);

private:
  friend HybridBase;
  enum class WeakObjectType : uint8_t {
    NotSupported,
    WeakRef,
    JSIWeakObject,
  };

  WeakRuntimeHolder _runtimeHolder;
  std::shared_ptr<jsi::Pointer> _weakObject;
  WeakObjectType _weakObjectType;
};

} // namespace expo
