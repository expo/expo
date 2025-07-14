// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JNIDeallocator.h"

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/CallInvoker.h>

namespace jsi = facebook::jsi;
namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {

class JavaScriptValue;

class JavaScriptObject;

class JSIContext;

/**
 * A wrapper for the jsi::Runtime.
 * This class is used as a bridge between CPP and Kotlin and to encapsulate common runtime helper functions.
 *
 * Instances of this class should be managed using a shared smart pointer.
 * To pass runtime information to all of `JavaScriptValue` and `JavaScriptObject` we use `weak_from_this()`
 * that requires that the object is held via a smart pointer. Otherwise, `weak_from_this()` returns `nullptr`.
 */
class JavaScriptRuntime : public std::enable_shared_from_this<JavaScriptRuntime> {
public:
  JavaScriptRuntime(
    jsi::Runtime *runtime,
    std::shared_ptr<react::CallInvoker> jsInvoker
  );

  /**
   * Returns the underlying runtime object.
   */
  jsi::Runtime &get() const noexcept;

  /**
   * Evaluates given JavaScript source code.
   * @throws if the input format is unknown, or evaluation causes an error,
   * a jni::JniException<JavaScriptEvaluateException> will be thrown.
   */
  jni::local_ref<jni::HybridClass<JavaScriptValue, Destructible>::javaobject> evaluateScript(
    const std::string &script
  );

  /**
   * Evaluates given JavaScript source code.
   * @throws if the input format is unknown, or evaluation causes an error,
   * a jni::JniException<JavaScriptEvaluateException> will be thrown.
   */
  void evaluateVoidScript(
    const std::string &script
  );

  /**
   * Returns the runtime global object for use in Kotlin.
   */
  jni::local_ref<jni::HybridClass<JavaScriptObject, Destructible>::javaobject> global() noexcept;

  /**
   * Creates a new object for use in Kotlin.
   */
  jni::local_ref<jni::HybridClass<JavaScriptObject, Destructible>::javaobject> createObject() noexcept;

  /**
   * Drains the JavaScript VM internal Microtask (a.k.a. event loop) queue.
   */
  void drainJSEventLoop();

  void installMainObject();

  std::shared_ptr<react::CallInvoker> jsInvoker;

  std::shared_ptr<jsi::Object> getMainObject() noexcept;

private:
  std::shared_ptr<jsi::Runtime> runtime;
  std::shared_ptr<jsi::Object> mainObject;
};
} // namespace expo
